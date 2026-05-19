"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ethers } from "ethers";
import { MockProduct } from "@/lib/mock/products";
import { useWallet } from "@/lib/web3/WalletContext";
import { getEcommerceContract, RPC_URL } from "@/lib/web3/contracts";

export interface CartItem {
  productId: number;
  name: string;
  price: number; // cents
  quantity: number;
  companyId: number;
  vendor: string;
  imageUrl?: string;
}

interface CartCtx {
  items: CartItem[];
  cartTotal: number;
  cartCount: number;
  addItem: (product: MockProduct, qty?: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { address, isRegistered, signer, checkRegistration } = useWallet();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!address || !signer) {
      setItems([]);
      return;
    }
    if (!isRegistered) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use HTTP provider for reads to avoid MetaMask network dependency
      const readProvider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = getEcommerceContract(readProvider);

      const scItems = await contract.getCart(address);

      // Cache company names to avoid redundant RPC calls
      const companyCache: Record<number, string> = {};

      const mappedItems: CartItem[] = [];
      for (const item of scItems) {
        const qty = Number(item.quantity);
        if (qty <= 0) continue;
        try {
          const p = await contract.getProduct(Number(item.productId));
          const companyId = Number(p.companyId);

          if (!companyCache[companyId]) {
            try {
              const company = await contract.getCompanyById(companyId);
              companyCache[companyId] = company.name;
            } catch {
              companyCache[companyId] = `Empresa #${companyId}`;
            }
          }

          mappedItems.push({
            productId: Number(item.productId),
            name: p.name,
            price: Number(p.price),
            quantity: qty,
            companyId,
            vendor: companyCache[companyId],
            imageUrl: "/images/placeholder-product.jpg",
          });
        } catch (e) {
          console.error(`Error fetching product #${item.productId}:`, e);
        }
      }

      setItems(mappedItems);
    } catch (error) {
      console.error("Error refreshing cart from SC:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, isRegistered, signer]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  async function addItem(product: MockProduct, qty = 1) {
    if (!address || !signer) return;
    try {
      const contract = getEcommerceContract(signer);
      const tx = await contract.addToCart(product.id, qty);
      await tx.wait();
      if (!isRegistered) await checkRegistration(address, signer);
      await refreshCart();
    } catch (error) {
      console.error("Error adding to cart on SC:", error);
    }
  }

  async function removeItem(productId: number) {
    if (!address || !isRegistered || !signer) return;
    try {
      const contract = getEcommerceContract(signer);
      const remaining = items.filter((i) => i.productId !== productId);
      const clearTx = await contract.clearCart();
      await clearTx.wait();
      for (const item of remaining) {
        const addTx = await contract.addToCart(item.productId, item.quantity);
        await addTx.wait();
      }
      await refreshCart();
    } catch (error) {
      console.error("Error removing item from cart on SC:", error);
    }
  }

  async function updateQuantity(productId: number, qty: number) {
    if (qty <= 0) { await removeItem(productId); return; }
    if (!address || !isRegistered || !signer) return;
    try {
      const contract = getEcommerceContract(signer);
      const current = items.find((i) => i.productId === productId);
      if (!current) return;
      if (qty > current.quantity) {
        const addTx = await contract.addToCart(productId, qty - current.quantity);
        await addTx.wait();
      } else if (qty < current.quantity) {
        const updated = items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i);
        const clearTx = await contract.clearCart();
        await clearTx.wait();
        for (const item of updated) {
          const addTx = await contract.addToCart(item.productId, item.quantity);
          await addTx.wait();
        }
      }
      await refreshCart();
    } catch (error) {
      console.error("Error updating quantity on SC:", error);
    }
  }

  async function clearCart() {
    if (!address || !isRegistered || !signer) return;
    try {
      const contract = getEcommerceContract(signer);
      const tx = await contract.clearCart();
      await tx.wait();
      await refreshCart();
    } catch (error) {
      console.error("Error clearing cart on SC:", error);
    }
  }

  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, cartTotal, cartCount, addItem, removeItem, updateQuantity, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
