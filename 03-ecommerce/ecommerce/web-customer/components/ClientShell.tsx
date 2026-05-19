"use client";

import React from "react";
import { useWallet } from "@/lib/web3/WalletContext";
import { AppHeader } from "@/components/AppHeader";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const { isHydrating } = useWallet();

  // Block render completely until wallet session is restored from localStorage.
  // This mirrors the (company)/layout pattern in web-admin: the SSR output and
  // the first client render both produce null, so there is no hydration mismatch.
  // After the mount useEffect resolves the session, everything renders in one frame.
  if (isHydrating) return null;

  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
