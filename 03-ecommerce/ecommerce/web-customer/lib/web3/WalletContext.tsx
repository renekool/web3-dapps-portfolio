"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { BrowserProvider, JsonRpcSigner, ethers } from "ethers";
import { toast } from "sonner";
import { getEcommerceContract, getEuroTokenContract, RPC_URL } from "@/lib/web3/contracts";

const SESSION_KEY = "viva_shop_wallet_session";

function saveSession(address: string) {
  localStorage.setItem(SESSION_KEY, address);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("viva_shop_wallet_connected");
}

function loadSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

async function fetchEurtBalance(walletAddress: string): Promise<{ formatted: string; raw: bigint }> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const euroToken = getEuroTokenContract(provider);
    const [bal, dec] = await Promise.all([
      euroToken.balanceOf(walletAddress),
      euroToken.decimals().catch(() => 6),
    ]);
    return {
      formatted: parseFloat(ethers.formatUnits(bal, dec)).toFixed(4) + " EURT",
      raw: BigInt(bal),
    };
  } catch {
    return { formatted: "— EURT", raw: 0n };
  }
}

interface WalletCtx {
  address: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  chainId: number | null;
  balance: string;
  balanceRaw: bigint;
  isConnected: boolean;
  isLoading: boolean;
  isHydrating: boolean;
  isRegistered: boolean;
  checkRegistration: (addr: string, signerInstance: JsonRpcSigner) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState("0.0000 EURT");
  const [balanceRaw, setBalanceRaw] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);
  // isHydrating guards the wallet button in AppHeader and gated pages during the
  // async signer re-acquisition window (eth_accounts is fast but still async).
  const [isHydrating, setIsHydrating] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  // Version counter: ensures only the latest balance fetch wins (prevents stale overwrites)
  const balanceFetchVersion = useRef(0);
  // Ref kept in sync with address state so refreshBalance is stable (no stale closure)
  const addressRef = useRef<string | null>(null);

  const checkRegistration = useCallback(async (addr: string, signerInstance: JsonRpcSigner) => {
    try {
      const contract = getEcommerceContract(signerInstance);
      const contractAddr = await contract.getAddress();
      console.log(`Checking registration for ${addr} on contract ${contractAddr}`);
      
      const registered = await contract.isCustomerRegistered(addr);
      setIsRegistered(registered);
    } catch (error) {
      console.error("Error checking registration (possibly contract not deployed at address or wrong network):", error);
      setIsRegistered(false);
    }
  }, []);

  // Keep addressRef in sync so refreshBalance always reads the latest address
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const refreshBalance = useCallback(async () => {
    const addr = addressRef.current;
    if (!addr) return;
    const version = ++balanceFetchVersion.current;
    const { formatted, raw } = await fetchEurtBalance(addr);
    if (version !== balanceFetchVersion.current) return;
    setBalance(formatted);
    setBalanceRaw(raw);
  }, []); // Stable — reads address from ref, no stale closure

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);
    setIsRegistered(false);
    setBalance("0.0000 EURT");
    setBalanceRaw(0n);
    clearSession();
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.warning("MetaMask no detectado. Por favor instálalo para continuar.");
      return;
    }

    setIsLoading(true);
    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const userSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(userSigner);
      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
      saveSession(accounts[0]);

      if (Number(network.chainId) !== 31337) {
        toast.error("Red incorrecta. Por favor conéctate a Anvil (Localhost 8545)");
        setIsRegistered(false);
        return;
      }

      const connectVersion = ++balanceFetchVersion.current;
      fetchEurtBalance(accounts[0]).then(({ formatted, raw }) => {
        if (connectVersion !== balanceFetchVersion.current) return;
        setBalance(formatted);
        setBalanceRaw(raw);
      }).catch(() => {});
      await checkRegistration(accounts[0], userSigner);
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      if (error.code === 4001) {
        toast.error("Conexión rechazada por el usuario.");
      } else {
        toast.error("Error al conectar la wallet.");
      }
      disconnect();
    } finally {
      setIsLoading(false);
    }
  }, [disconnect]);

  // On mount: restore session from localStorage.
  // NOTE: lazy useState init doesn't run on the client in Next.js SSR — React reuses
  // the server-computed state (null). So we MUST call setAddress here, synchronously
  // before any async work, to ensure isConnected flips to true in one pass.
  useEffect(() => {
    const savedAddress = loadSession();

    if (!savedAddress) {
      setIsHydrating(false);
      return;
    }

    // Restore address immediately — this makes isConnected=true before isHydrating=false,
    // so no "Conectar Wallet" flash ever reaches the screen.
    setAddress(savedAddress);

    if (typeof window === "undefined" || !window.ethereum) {
      // No MetaMask — address is set, signer unavailable. Still mark hydration done.
      setIsHydrating(false);
      return;
    }

    // Silently re-acquire signer with eth_accounts (no popup).
    (window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>)
      .then((accounts) => {
        if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
          const browserProvider = new BrowserProvider(window.ethereum!);
          browserProvider.getSigner().then((walletSigner) => {
            setSigner(walletSigner);
            setProvider(browserProvider);
            browserProvider.getNetwork().then((net) => setChainId(Number(net.chainId))).catch(() => {});
            fetchEurtBalance(savedAddress).then(({ formatted, raw }) => {
              setBalance(formatted);
              setBalanceRaw(raw);
            }).catch(() => {});
            checkRegistration(savedAddress, walletSigner).catch(() => {});
          }).catch(() => {});
        } else {
          // MetaMask account changed while app was closed — invalidate session.
          clearSession();
          setAddress(null);
        }
      })
      .catch(() => {})
      .finally(() => setIsHydrating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        connect();
      } else {
        disconnect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum!.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum!.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        address,
        signer,
        provider,
        chainId,
        balance,
        balanceRaw,
        isConnected: !!address,
        isLoading,
        isHydrating,
        isRegistered,
        checkRegistration,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
