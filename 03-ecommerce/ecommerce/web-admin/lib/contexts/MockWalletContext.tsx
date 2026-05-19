"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { MockRole, MockWalletState, connectMockWallet } from "../mock/mockWallet";

interface MockWalletContextType extends MockWalletState {
  connect: (role: MockRole) => Promise<void>;
  disconnect: () => void;
}

const MockWalletContext = createContext<MockWalletContextType | undefined>(undefined);

export function MockWalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MockWalletState>({
    address: null,
    role: "none",
    balance: "0.00 ETH",
    status: "disconnected",
  });

  const connect = useCallback(async (role: MockRole) => {
    setState((prev) => ({ ...prev, status: "connecting" }));
    
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const newState = connectMockWallet(role);
    setState(newState);
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      role: "none",
      balance: "0.00 ETH",
      status: "disconnected",
    });
  }, []);

  return (
    <MockWalletContext.Provider value={{ ...state, connect, disconnect }}>
      {children}
    </MockWalletContext.Provider>
  );
}

export function useMockWallet() {
  const context = useContext(MockWalletContext);
  if (context === undefined) {
    throw new Error("useMockWallet must be used within a MockWalletProvider");
  }
  return context;
}
