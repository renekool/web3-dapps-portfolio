"use client";

import { useState } from "react";
import { Copy, Check, Building2 } from "lucide-react";
import { Badge } from "@/components/modern-ui/badge";
import { formatWalletAddress } from "@/lib/utils";
import { useWallet } from "@/lib/web3/WalletContext";

function formatDate(timestamp: bigint): string {
  if (!timestamp) return "N/A";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function CompanyInfoCard() {
  const [copied, setCopied] = useState(false);
  const { companyInfo } = useWallet();

  if (!companyInfo) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(companyInfo.companyAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden bg-card border border-border/40 rounded-2xl px-5 py-4 shadow-sm">
      {/* Decorative background icon */}
      <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 text-primary opacity-[0.06] pointer-events-none select-none" />

      {/* Left: name + metadata */}
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-foreground leading-tight">{companyInfo.name}</span>
          <Badge
            variant={companyInfo.isActive ? "default" : "secondary"}
            className={`text-[10px] font-bold px-2 py-0.5 ${
              companyInfo.isActive
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {companyInfo.isActive ? "ACTIVA" : "INACTIVA"}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Wallet:</span>
          <span className="font-mono">{formatWalletAddress(companyInfo.companyAddress)}</span>
          <button
            onClick={handleCopy}
            className="p-0.5 rounded hover:text-foreground transition-colors"
            title="Copiar dirección"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <span className="mx-1">•</span>
          <span>Registro: {formatDate(companyInfo.registeredAt)}</span>
        </div>
      </div>
    </div>
  );
}
