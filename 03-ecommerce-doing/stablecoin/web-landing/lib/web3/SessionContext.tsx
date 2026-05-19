"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type SessionStatus = "ANONYMOUS" | "AUTHENTICATED" | "SESSION_ACTIVE_WALLET_LOCKED";

interface SessionContextType {
  status: SessionStatus;
  login: (address: string) => void;
  logout: () => void;
  setWalletLocked: (locked: boolean) => void;
  sessionAddress: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const SESSION_KEY = "vivapay_session_v1";
const SESSION_ADDRESS_KEY = "vivapay_session_address";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("ANONYMOUS");
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_ADDRESS_KEY);
    setSessionAddress(null);
    setStatus("ANONYMOUS");
  }, []);

  const login = useCallback((address: string) => {
    localStorage.setItem(SESSION_KEY, "active");
    localStorage.setItem(SESSION_ADDRESS_KEY, address);
    setSessionAddress(address);
    setStatus("AUTHENTICATED");
  }, []);

  const setWalletLocked = useCallback((locked: boolean) => {
    setStatus((prev) => {
      if (locked) return "SESSION_ACTIVE_WALLET_LOCKED";
      return "AUTHENTICATED";
    });
  }, []);

  // Hydration & Multi-tab sync
  useEffect(() => {
    const hydrate = () => {
      const flag = localStorage.getItem(SESSION_KEY);
      const address = localStorage.getItem(SESSION_ADDRESS_KEY);

      if (flag === "active" && address) {
        setSessionAddress(address);
        setStatus("AUTHENTICATED");
      } else {
        setStatus("ANONYMOUS");
      }
    };

    hydrate();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_KEY && !e.newValue) {
        logout();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout]);

  return (
    <SessionContext.Provider value={{ status, login, logout, setWalletLocked, sessionAddress }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
