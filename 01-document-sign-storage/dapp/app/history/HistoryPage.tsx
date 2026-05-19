"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "../../hooks/useWeb3";
import { DocumentHistory } from "../../components/features/history/DocumentHistory";

export default function HistoryPage() {
  const router = useRouter();
  const { isConnected } = useWeb3();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  return <DocumentHistory />;
}
