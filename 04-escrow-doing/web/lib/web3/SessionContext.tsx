"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type SessionStatus = "ANONYMOUS" | "AUTHENTICATED";

interface SessionContextType {
  status: SessionStatus;
  sessionAddress: string | null;
  login: (address: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const SESSION_KEY = "escrow_session_v1";
const SESSION_ADDRESS_KEY = "escrow_session_address";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("ANONYMOUS");
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_ADDRESS_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${SESSION_ADDRESS_KEY}=; path=/; max-age=0; SameSite=Lax`;
    setSessionAddress(null);
    setStatus("ANONYMOUS");
  }, []);

  const login = useCallback((address: string) => {
    localStorage.setItem(SESSION_KEY, "active");
    localStorage.setItem(SESSION_ADDRESS_KEY, address);
    document.cookie = `${SESSION_KEY}=active; path=/; SameSite=Lax`;
    document.cookie = `${SESSION_ADDRESS_KEY}=${address}; path=/; SameSite=Lax`;
    setSessionAddress(address);
    setStatus("AUTHENTICATED");
  }, []);

  useEffect(() => {
    const flag = localStorage.getItem(SESSION_KEY);
    const address = localStorage.getItem(SESSION_ADDRESS_KEY);
    if (flag === "active" && address) {
      setSessionAddress(address);
      setStatus("AUTHENTICATED");
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_KEY && !e.newValue) {
        logout();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout]);

  return (
    <SessionContext.Provider value={{ status, sessionAddress, login, logout }}>
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
