"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, ChevronDown, Copy, Check, LogOut } from "lucide-react";
import { useWallet } from "@/lib/web3/WalletContext";
import { cn, formatWalletAddress } from "@/lib/utils";

interface AppHeaderProps {
  title?: React.ReactNode;
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const { address, balance, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    router.push("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50">
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 pt-3">
        <div className="flex justify-between items-center h-[60px] px-5 rounded-2xl bg-background/75 backdrop-blur-xl border border-border/40 shadow-sm shadow-border/10">
          {title ? (
            <div className="flex-1 min-w-0 mr-4">
              <span className="text-lg font-extrabold tracking-tight text-foreground font-[family-name:var(--font-sans)] block truncate">
                {title}
              </span>
            </div>
          ) : (
            <Link
              href="/"
              className="text-lg font-extrabold tracking-tight font-[family-name:var(--font-sans)] shrink-0"
            >
              <span className="text-primary">Viva</span><span className="text-[#1B1C1A]">Pay</span> <span className="text-primary">Admin</span>
            </Link>
          )}

          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              {/* Wallet button */}
              <button
                onClick={() => setIsOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer",
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
          </div>

        </div>
      </div>
    </nav>
  );
}
