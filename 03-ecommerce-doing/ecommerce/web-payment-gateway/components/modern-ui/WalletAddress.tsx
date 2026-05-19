"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { formatWalletAddress, cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/modern-ui/tooltip";

interface WalletAddressProps {
  address: string;
  className?: string;
  showIconAlways?: boolean;
}

export function WalletAddress({ address, className, showIconAlways = true }: WalletAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex items-center gap-1.5 group/wallet", className)}>
      <span className="font-mono text-inherit">
        {formatWalletAddress(address)}
      </span>
      <TooltipProvider delayDuration={100}>
        <Tooltip open={copied || undefined}>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              className={cn(
                "p-1 rounded-md hover:bg-primary/10 text-muted-foreground/40 hover:text-primary transition-all duration-200 cursor-pointer flex items-center justify-center",
                !showIconAlways && "opacity-0 group-hover/wallet:opacity-100"
              )}
              title={copied ? "Copiado" : "Copiar dirección"}
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="py-1 px-2 text-[10px] font-bold">
            {copied ? "¡Copiado!" : "Copiar dirección"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
