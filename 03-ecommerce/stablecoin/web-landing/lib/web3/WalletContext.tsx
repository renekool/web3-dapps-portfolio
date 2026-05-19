"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserProvider, formatUnits, Contract } from "ethers";
import { useRouter } from "next/navigation";
import { useSession } from "./SessionContext";

type WalletStatus = "idle" | "connecting" | "connected" | "disconnected" | "no-wallet" | "error" | "unsupported-network" | "checking";

interface WalletContextType {
  address: string | null;
  balance: string;
  status: WalletStatus;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  resetStatus: () => void;
  isWalletLocked: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const EUROTOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0.0000");
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [chainId, setChainId] = useState<number | null>(null);
  const [isWalletLocked, setIsWalletLocked] = useState(false);

  const { login, logout } = useSession();
  const router = useRouter();

  // --- Core Web3 Logic ---

  const fetchBalance = async (provider: BrowserProvider, account: string) => {
    try {
      const contract = new Contract(EUROTOKEN_ADDRESS, EUROTOKEN_ABI, provider);
      const [bal, dec] = await Promise.all([
        contract.balanceOf(account),
        contract.decimals().catch(() => 6) // Fallback to 6 if call fails
      ]);
      setBalance(Number(formatUnits(bal, dec)).toFixed(4));
    } catch (err) {
      console.error("[Wallet] Error fetching balance:", err);
      setBalance("0.00");
    }
  };

  const syncState = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setStatus("no-wallet");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
      
      if (accounts.length > 0) {
        const account = accounts[0];
        setAddress(account);
        login(account);
        
        if (currentChainId !== targetChainId) {
          console.warn(`[Wallet] Unsupported network: ${currentChainId}. Expected: ${targetChainId}`);
          setStatus("unsupported-network");
        } else {
          setStatus("connected");
          await fetchBalance(provider, account);
        }
      } else {
        // Not connected or locked
        setAddress(null);
        setStatus("idle");
      }
    } catch (err) {
      console.error("[Wallet] Sync error:", err);
    }
  }, [login]);

  const connectWallet = async () => {
    console.log("[Wallet] -- Manual Connection Triggered --");
    if (typeof window === "undefined" || !window.ethereum) {
      console.error("[Wallet] Fatal: window.ethereum not found.");
      setStatus("no-wallet");
      return;
    }

    try {
      setStatus("connecting");
      console.log("[Wallet] Status set to CONNECTING. Calling eth_requestAccounts...");

      // NATIVE EIP-1193 Call (Purest way)
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      console.log("[Wallet] Provider response received:", accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error("User rejected or no accounts found");
      }

      const account = accounts[0];
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
      
      console.log("[Wallet] Syncing account details:", account, "Chain:", currentChainId);

      setAddress(account);
      setChainId(currentChainId);
      login(account);
      
      if (currentChainId !== targetChainId) {
        setStatus("unsupported-network");
      } else {
        setStatus("connected");
        // Fetch balance without blocking UI
        fetchBalance(provider, account);
      }
      
      console.log("[Wallet] SUCCESS. Redirecting...");
      router.push("/compra");
    } catch (err: any) {
      if (err.code === 4001) {
        console.log("[Wallet] Connection cancelled by user.");
      } else {
        console.error("[Wallet] Connection EXCEPTION:", err);
      }
      
      // Detailed error breakdown for other specific cases
      if (err.code === -32002) {
        console.warn("[Wallet] Request already pending. Check your extension.");
      }
      setStatus("idle");
    }
  };

  const resetStatus = () => setStatus("idle");

  const disconnectWallet = () => {
    setAddress(null);
    setBalance("0.00");
    setChainId(null);
    setStatus("disconnected");
    logout();
    if (window.location.pathname !== "/") {
      router.push("/");
    }
  };

  // --- Listeners ---
  useEffect(() => {
    syncState();

    if (window.ethereum) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          syncState();
        }
      };

      const handleChain = () => window.location.reload();

      window.ethereum.on("accountsChanged", handleAccounts);
      window.ethereum.on("chainChanged", handleChain);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccounts);
        window.ethereum.removeListener("chainChanged", handleChain);
      };
    }
  }, [syncState]);

  return (
    <WalletContext.Provider 
      value={{ 
        address, 
        balance, 
        status, 
        chainId, 
        connectWallet, 
        disconnectWallet,
        resetStatus,
        isWalletLocked
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
