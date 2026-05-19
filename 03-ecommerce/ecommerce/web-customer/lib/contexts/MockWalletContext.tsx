"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { connectMockWallet } from "@/lib/mock/mockWallet";

type WalletStatus = "idle" | "connecting" | "connected";

interface MockWalletCtx {
  address: string | null;
  isConnected: boolean;
  status: WalletStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const MockWalletContext = createContext<MockWalletCtx | null>(null);

const STORAGE_KEY = "viva_shop_wallet_address";

export function MockWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");

  // Load from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setAddress(saved);
      setStatus("connected");
    }
  }, []);

  async function connect() {
    if (status === "connecting") return;
    setStatus("connecting");
    try {
      const addr = await connectMockWallet();
      setAddress(addr);
      setStatus("connected");
      localStorage.setItem(STORAGE_KEY, addr);
    } catch {
      setStatus("idle");
    }
  }

  function disconnect() {
    setAddress(null);
    setStatus("idle");
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <MockWalletContext.Provider value={{ address, isConnected: !!address, status, connect, disconnect }}>
      {children}
    </MockWalletContext.Provider>
  );
}

export function useMockWallet() {
  const ctx = useContext(MockWalletContext);
  if (!ctx) throw new Error("useMockWallet must be used within MockWalletProvider");
  return ctx;
}
