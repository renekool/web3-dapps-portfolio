"use client";

import React, { createContext, useContext } from "react";

export interface Invoice {
  id: bigint;
  customer: string;
  companyId: bigint;
  totalAmount: bigint;
  isPaid: boolean;
  createdAt: bigint;
}

interface InvoicesContextType {
  invoices: Invoice[];
  loadInvoices: () => Promise<Invoice[]>;
  isRefreshing: boolean;
}

const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  return (
    <InvoicesContext.Provider
      value={{
        invoices: [],
        loadInvoices: async () => [],
        isRefreshing: false,
      }}
    >
      {children}
    </InvoicesContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoicesContext);
  if (!ctx) throw new Error("useInvoices must be used within InvoicesProvider");
  return ctx;
}
