"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useWallet } from "@/lib/web3/WalletContext";
import { getEcommerceContract } from "@/lib/web3/contracts";
import { ethers } from "ethers";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  companyId: number;
  customer: string;
  amount: number;
  status: OrderStatus;
  date: string;
}

interface OrdersCtx {
  orders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
}

const OrdersContext = createContext<OrdersCtx | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useWallet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
      const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = getEcommerceContract(rpcProvider);
      const contractAddr = await contract.getAddress();
      console.log(`Fetching orders for ${address} from contract: ${contractAddr}`);

      if (!contractAddr || contractAddr === "0x0000000000000000000000000000000000000000") {
        throw new Error("Contract address is not configured correctly.");
      }

      const invoiceIds: bigint[] = await contract.getInvoicesByCustomer(address);

      const mappedOrders: Order[] = await Promise.all(
        invoiceIds.map(async (invoiceId: bigint) => {
          const inv = await contract.getInvoice(invoiceId);
          const status: OrderStatus = inv.isPaid ? "paid" : "pending";
          return {
            id: invoiceId.toString(),
            companyId: Number(inv.companyId),
            customer: inv.customerAddress,
            amount: Number(inv.totalAmount),
            status,
            date: new Date(Number(inv.createdAt) * 1000).toISOString(),
          };
        })
      );

      setOrders(mappedOrders.reverse()); // Newest first
    } catch (error) {
      console.error("Error fetching orders from SC:", error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [isConnected, fetchOrders]);

  function updateOrderStatus(id: string, status: OrderStatus) {
    // This is mostly for local UI updates before a refresh, 
    // but the source of truth is the SC.
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }

  return (
    <OrdersContext.Provider value={{ orders, loading, refreshOrders: fetchOrders, updateOrderStatus }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
