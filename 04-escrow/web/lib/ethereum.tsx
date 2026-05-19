"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useSession } from "./web3/SessionContext";

export type WalletStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "no-wallet"
  | "unsupported-network";

export interface EthereumContextType {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  status: WalletStatus;
  isWrongNetwork: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
}

const EthereumContext = createContext<EthereumContextType | undefined>(undefined);

const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);

export function EthereumProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");

  const { login, logout } = useSession();

  const syncState = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setStatus("no-wallet");
      return;
    }

    // Leer localStorage directamente (síncrono, sin race conditions con SessionContext).
    // Solo auto-conectar si el usuario había conectado manualmente antes.
    // logout() limpia esta key → F5 después de desconectar queda en idle.
    const hasSession = localStorage.getItem("escrow_session_v1") === "active";
    if (!hasSession) {
      setStatus("idle");
      return;
    }

    try {
      const p = new BrowserProvider(window.ethereum);
      const accounts = await p.send("eth_accounts", []);
      const network = await p.getNetwork();
      const currentChainId = Number(network.chainId);

      setChainId(currentChainId);

      if (accounts.length > 0) {
        const s = await p.getSigner();
        setProvider(p);
        setSigner(s);
        setAccount(accounts[0]);
        login(accounts[0]);

        if (currentChainId !== TARGET_CHAIN_ID) {
          setStatus("unsupported-network");
        } else {
          setStatus("connected");
        }
      } else {
        setStatus("idle");
      }
    } catch {
      // silent — not connected
    }
  }, [login]);

  const connect = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) {
      setStatus("no-wallet");
      return false;
    }

    try {
      setStatus("connecting");
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];

      if (!accounts || accounts.length === 0) throw new Error("No accounts");

      const p = new BrowserProvider(window.ethereum);
      const network = await p.getNetwork();
      const currentChainId = Number(network.chainId);
      const s = await p.getSigner();

      setProvider(p);
      setSigner(s);
      setAccount(accounts[0]);
      setChainId(currentChainId);
      login(accounts[0]);

      if (currentChainId !== TARGET_CHAIN_ID) {
        setStatus("unsupported-network");
      } else {
        setStatus("connected");
      }
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 4001 || code === -32002) {
        // user rejected or already pending — silent
      }
      setStatus("idle");
      return false;
    }
  }, [login]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setStatus("disconnected");
    logout();
  }, [logout]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      setStatus("no-wallet");
      return;
    }

    syncState();

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        syncState();
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
  }, [syncState, disconnect]);

  const isWrongNetwork = chainId !== null && chainId !== TARGET_CHAIN_ID;

  return (
    <EthereumContext.Provider
      value={{ provider, signer, account, chainId, status, isWrongNetwork, connect, disconnect }}
    >
      {children}
    </EthereumContext.Provider>
  );
}

export function useEthereumContext() {
  const context = useContext(EthereumContext);
  if (context === undefined) {
    throw new Error("useEthereumContext must be used within an EthereumProvider");
  }
  return context;
}
