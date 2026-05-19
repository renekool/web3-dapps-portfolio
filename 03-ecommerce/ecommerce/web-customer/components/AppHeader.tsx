"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wallet, ChevronDown, Copy, Check, LogOut, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/web3/WalletContext";
import { useCart } from "@/lib/contexts/CartContext";
import { Button } from "@/components/modern-ui/button";
import { cn, formatWalletAddress } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Productos", href: "/" },
  { label: "Carrito", href: "/cart" },
  { label: "Órdenes", href: "/orders" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected, isLoading, balance, connect, disconnect } = useWallet();
  const { cartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isConnecting = isLoading;
  const displayAddress = address ? formatWalletAddress(address) : "Conectar Wallet";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    setIsOpen(false);
    disconnect();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 lg:px-12 transition-all">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-sans)]">
          <span className="text-primary">Viva</span><span className="text-[#1B1C1A]">Pay</span> <span className="text-primary">Shop</span>
        </span>
      </Link>

      {/* Nav tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
                ${isActive 
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"}
              `}
            >
              {label}
              {label === "Carrito" && isConnected && cartCount > 0 && (
                <span className={`
                  flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-black rounded-full transition-colors
                  ${isActive ? "bg-primary text-white" : "bg-primary/20 text-primary"}
                `}>
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Wallet section */}
      <div className="flex items-center gap-4">
        {isConnected && address ? (
          <div className="relative" ref={dropdownRef}>
            {/* Wallet button */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer font-[family-name:var(--font-sans)]",
                isOpen
                  ? "bg-background border-primary/30 ring-2 ring-primary/10"
                  : "bg-muted border-border/30"
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  address ? "bg-success" : "bg-muted-foreground/30"
                )}
              />
              <span className="hidden md:inline truncate max-w-[120px]">{displayAddress}</span>
              <ChevronDown
                className={cn("w-3 h-3 transition-transform shrink-0", isOpen && "rotate-180")}
              />
            </button>

            {/* Dropdown */}
            {isOpen && (
              <div className="absolute top-full right-0 mt-3 w-72 bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50">
                {/* Active Wallet section */}
                <div className="p-5 border-b border-border/20 bg-muted/40">
                  <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Active Wallet</span>
                    <span className="px-2 py-0.5 rounded border bg-primary/8 text-primary border-primary/20">
                      Anvil
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground bg-primary shadow-md shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold text-foreground">Wallet</p>
                      <p className="text-xs font-medium text-muted-foreground font-mono mt-1.5 truncate">
                        {balance}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-xs font-semibold truncate hidden sm:inline">
                          {copied ? "¡Copiado!" : "Copiar dirección"}
                        </span>
                        {copied && (
                          <span className="text-xs font-semibold truncate sm:hidden text-success">
                            ¡Copiado!
                          </span>
                        )}
                        <span className="text-xs font-mono text-muted-foreground truncate">
                          {formatWalletAddress(address)}
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">Desconectar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={connect}
            disabled={isConnecting}
            size="sm"
            className="rounded-full px-5 transition-all"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Conectando...</span>
              </div>
            ) : (
              "Conectar Wallet"
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
