"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { ethers } from "ethers";
import { detectRole, getCompanyId, type Role, type CompanyInfo } from "./roleDetection";
import { getEcommerceContract, getHttpProvider } from "./contract";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletContextType {
  address: string | null;
  role: Role | null;
  companyId: bigint | null;
  companyInfo: CompanyInfo | null;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  balance: string;
  isConnected: boolean;
  isLoading: boolean;
  isHydrating: boolean;
  isDisconnecting: boolean;
  connect: (mockRole?: Role) => Promise<{ role: Role | null; companyInfo: CompanyInfo | null }>;
  disconnect: () => void;
  refreshRole: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const RESET_STATE = {
  address: null,
  role: null as Role | null,
  companyId: null,
  companyInfo: null,
  signer: null,
  provider: null,
  balance: "0.00 EURT",
};

const SESSION_KEY = "vp_admin_session";

const EURT_ADDRESS =
  process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const EURT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function fetchEurtBalance(walletAddress: string): Promise<string> {
  try {
    const provider = getHttpProvider();
    const contract = new ethers.Contract(EURT_ADDRESS, EURT_ABI, provider);
    const [bal, dec] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals().catch(() => 18),
    ]);
    return parseFloat(ethers.formatUnits(bal, dec)).toFixed(4) + " EURT";
  } catch {
    return "— EURT";
  }
}

function saveSession(
  address: string,
  role: Role,
  companyId: bigint | null,
  companyInfo: CompanyInfo | null
) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      address,
      role,
      companyId: companyId?.toString() ?? null,
      companyInfo: companyInfo
        ? { ...companyInfo, registeredAt: companyInfo.registeredAt.toString() }
        : null,
    })
  );
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function loadSession(): {
  address: string;
  role: Role;
  companyId: bigint | null;
  companyInfo: CompanyInfo | null;
} | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return {
      address: s.address,
      role: s.role,
      companyId: s.companyId ? BigInt(s.companyId) : null,
      companyInfo: s.companyInfo
        ? { ...s.companyInfo, registeredAt: BigInt(s.companyInfo.registeredAt) }
        : null,
    };
  } catch {
    return null;
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [companyId, setCompanyId] = useState<bigint | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [balance, setBalance] = useState("0.00 EURT");
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const doConnect = useCallback(async (accounts: string[], mockRole?: Role) => {
    if (!accounts.length || !window.ethereum) return;
    setIsLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
      const walletSigner = await browserProvider.getSigner();
      const walletAddress = accounts[0];

      const httpProvider = getHttpProvider();
      const readContract = getEcommerceContract(httpProvider);

      let { role: detectedRole, companyInfo: info } = await detectRole(walletAddress, readContract);

      // Si el wallet es owner pero también tiene empresa, permitir acceso como company
      if (mockRole === "company" && detectedRole === "owner") {
        try {
          const c = await readContract.getCompanyByAddress(walletAddress);
          if (c.companyAddress !== ethers.ZeroAddress) {
            detectedRole = "company";
            info = {
              name: c.name,
              isActive: c.isActive,
              registeredAt: c.registeredAt,
              companyAddress: c.companyAddress,
            };
          }
        } catch {
          // owner sin empresa registrada
        }
      }

      // Validar estrictamente el rol "company"
      if (mockRole === "company" && detectedRole !== "company") {
        throw new Error("NO_COMPANY");
      }

      // Validar estrictamente el rol "owner"
      if (mockRole === "owner" && detectedRole !== "owner") {
        throw new Error("NOT_OWNER");
      }

      let cId: bigint | null = null;
      if (detectedRole === "company") {
        cId = await getCompanyId(walletAddress, readContract);
      }

      setBalance(await fetchEurtBalance(walletAddress));

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAddress(walletAddress);
      setRole(detectedRole);
      setCompanyId(cId);
      setCompanyInfo(info);
      saveSession(walletAddress, detectedRole, cId, info);
    } catch (err: any) {
      if (err.message !== "NO_COMPANY" && err.message !== "NOT_OWNER") {
        console.error("Connection error:", err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async (mockRole?: Role) => {
    if (!window.ethereum) {
      throw new Error("MetaMask no instalado");
    }
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    await doConnect(accounts, mockRole);
    
    // Devolvemos el role simulado o fallback (la UI usa el selectedRole)
    return { role: mockRole || "none", companyInfo: null };
  }, [doConnect]);

  const disconnect = useCallback(() => {
    setIsDisconnecting(true);
    clearSession();
    setAddress(RESET_STATE.address);
    setRole(RESET_STATE.role);
    setCompanyId(RESET_STATE.companyId);
    setCompanyInfo(RESET_STATE.companyInfo);
    setSigner(RESET_STATE.signer);
    setProvider(RESET_STATE.provider);
    setBalance(RESET_STATE.balance);
    setTimeout(() => setIsDisconnecting(false), 500);
  }, []);

  const refreshRole = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const httpProvider = getHttpProvider();
      const readContract = getEcommerceContract(httpProvider);
      const { role: detectedRole, companyInfo: info } = await detectRole(address, readContract);
      let cId: bigint | null = null;
      if (detectedRole === "company") {
        cId = await getCompanyId(address, readContract);
      }
      setRole(detectedRole);
      setCompanyId(cId);
      setCompanyInfo(info);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Restore session from localStorage on mount (survives F5)
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setAddress(session.address);
      setRole(session.role);
      setCompanyId(session.companyId);
      setCompanyInfo(session.companyInfo);

      // Silently re-acquire signer if wallet is still connected to the same address.
      // Uses eth_accounts (no popup) — only works if the user already approved the site.
      if (typeof window !== "undefined" && window.ethereum) {
        (window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>)
          .then((accounts) => {
            if (
              accounts.length > 0 &&
              accounts[0].toLowerCase() === session.address.toLowerCase()
            ) {
              const browserProvider = new ethers.BrowserProvider(
                window.ethereum as ethers.Eip1193Provider
              );
              browserProvider.getSigner().then((walletSigner) => {
                setSigner(walletSigner);
                setProvider(browserProvider);
                fetchEurtBalance(session.address).then(setBalance).catch(() => {});
              }).catch(() => {});
            }
          })
          .catch(() => {});
      }
    }
    setIsHydrating(false);
  }, []);

  // MetaMask listeners for active sessions
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        disconnect();
      } else if (accs[0].toLowerCase() !== address?.toLowerCase()) {
        doConnect(accs).catch(console.error);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [doConnect, disconnect, address]);

  return (
    <WalletContext.Provider
      value={{
        address,
        role,
        companyId,
        companyInfo,
        signer,
        provider,
        balance,
        isConnected: !!address,
        isLoading,
        isHydrating,
        isDisconnecting,
        connect,
        disconnect,
        refreshRole,
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
