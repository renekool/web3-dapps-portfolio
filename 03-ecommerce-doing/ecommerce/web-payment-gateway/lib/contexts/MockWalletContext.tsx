"use client";
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { connectMockWallet } from "@/lib/mock/mockWallet";

export type WalletStatus = "idle" | "connecting" | "connected";

interface MockWalletContextType {
  address: string | null;
  isConnected: boolean;
  status: WalletStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
  setAddress: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<WalletStatus>>;
}

const MockWalletContext = createContext<MockWalletContextType | null>(null);

export function MockWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");

  const connect = async () => {
    setStatus("connecting");
    try {
      const addr = await connectMockWallet();
      setAddress(addr);
      setStatus("connected");
    } catch (e) {
      setStatus("idle");
    }
  };

  const disconnect = () => {
    setAddress(null);
    setStatus("idle");
  };

  return (
    <MockWalletContext.Provider
      value={{ 
        address, 
        isConnected: status === "connected", 
        status, 
        connect, 
        disconnect,
        setAddress,
        setStatus
      }}
    >
      {children}
    </MockWalletContext.Provider>
  );
}

export function useMockWallet(): MockWalletContextType {
  const ctx = useContext(MockWalletContext);
  if (!ctx) throw new Error("useMockWallet must be used within MockWalletProvider");
  return ctx;
}
