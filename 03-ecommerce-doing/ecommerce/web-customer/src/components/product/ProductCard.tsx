'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Package, Minus, Plus, ShoppingCart, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/modern-ui/card";
import { Button } from "@/components/modern-ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string; // Kept for compatibility but not rendered as per mockup
  category?: string;
  vendor: string;
  vendorDescription?: string;
  description: string;
  stock: number;
  quantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onAddToCart: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ProductCard({
  name,
  price,
  vendor,
  vendorDescription,
  description,
  stock,
  quantity = 1,
  onIncrement,
  onDecrement,
  onAddToCart,
  disabled = false,
  loading = false,
}: ProductCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);

  // Handle ESC key to close overlay
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowOverlay(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <Card className="relative flex flex-col h-full bg-white border-[#F2EDE4] rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="flex flex-col gap-5 h-full">
        {/* Header Section */}
        <div className="flex-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#904729]/60 uppercase tracking-[0.15em] mb-1">
              {vendor}
            </span>
            <div className="flex items-center justify-between gap-2">
              <h3 
                className="font-semibold text-[14.5px] text-[#1B1C1A] leading-tight truncate py-0.5" 
                title={name}
              >
                {name}
              </h3>
              <button 
                type="button"
                onClick={() => setShowOverlay(true)}
                className="shrink-0 p-1.5 bg-[#FAF7F2] border border-[#F2EDE4] rounded-full text-[#904729]/70 hover:text-[#904729] hover:bg-white hover:shadow-sm transition-all active:scale-90"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Box - EXACT Mockup Design */}
        <div className="bg-[#FAF7F2] border border-[#F2EDE4] rounded-[20px] p-4 flex items-center mt-2">
          {/* Price Section */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#8A8A8A]">
              <Tag className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#904729]/40">Precio</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-bold leading-none tracking-tight text-[#904729]">
                {(price / 1000000).toFixed(2)}
              </span>
              <span className="text-[10px] font-bold text-[#904729]/70 uppercase tracking-widest">EURT</span>
            </div>
          </div>

          <div className="h-10 w-[1.5px] bg-[#E5E0D5]/60 shrink-0 mx-2" />

          {/* Availability Section */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-[#8A8A8A]">
              <Package className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#904729]/40">Disponibilidad</span>
            </div>
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-white border border-[#E5E0D5] rounded-full min-w-[100px] shadow-sm">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stock > 0 ? "bg-[#466739]" : "bg-destructive")} />
              <span className="text-sm font-bold text-[#1B1C1A] tabular-nums">
                {stock} uds.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions - EXACT Mockup Design */}
        <div className={cn("flex gap-3 items-center mt-auto pt-2", disabled && "opacity-80 cursor-not-allowed")}>
          {/* Stepper */}
          <div className="flex items-center justify-between w-[120px] h-12 bg-white border border-[#E5E0D5] rounded-xl px-1.5 shrink-0 shadow-sm">
            <button
              type="button"
              onClick={onDecrement}
              disabled={quantity <= 1 || disabled}
              className="w-8 h-8 flex items-center justify-center text-[#1B1C1A] hover:bg-[#FBF9F6] rounded-lg transition-colors disabled:opacity-20"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-[17px] font-black text-[#1B1C1A] min-w-[1.5rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={quantity >= stock || disabled}
              className="w-8 h-8 flex items-center justify-center text-[#1B1C1A] hover:bg-[#FBF9F6] rounded-lg transition-colors disabled:opacity-20"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <div className="flex-1 relative group/btn">
            <Button
              type="button"
              onClick={onAddToCart}
              disabled={disabled || stock === 0}
              loading={loading}
              icon={<ShoppingCart className="w-4 h-4" />}
              className={cn(
                "w-full h-12 text-white rounded-xl font-bold text-[13px] shadow-md transition-all active:scale-[0.97] disabled:opacity-80 disabled:cursor-not-allowed",
                disabled 
                  ? "bg-[#B58D79]" 
                  : "bg-primary hover:bg-primary/90 shadow-primary/20"
              )}
            >
              Añadir
            </Button>
            
            {disabled && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1B1C1A] text-white text-[10px] font-bold py-1 px-2 rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Conecta tu wallet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus Mode Overlay - EXACT Mockup Design */}
      {showOverlay && (
        <div 
          className="absolute inset-0 bg-[#FBF9F6]/99 backdrop-blur-xl z-40 p-8 flex flex-col items-start justify-center animate-in fade-in zoom-in-95 duration-300 cursor-pointer"
          onClick={() => setShowOverlay(false)}
        >
          {/* Close Button */}
          <button 
            type="button"
            onClick={() => setShowOverlay(false)}
            className="absolute top-6 right-6 p-2 bg-white border border-[#F2EDE4] rounded-full text-[#1B1C1A] shadow-xl hover:bg-[#FBF9F6] transition-all active:scale-90 z-50"
          >
            <X className="w-4 h-4" />
          </button>

          <div 
            className="w-full flex flex-col items-start gap-6 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header in Overlay */}
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] font-bold text-[#904729]/60 uppercase tracking-[0.2em] mb-2 block">
                {vendor}
              </span>
              <h3 className="font-bold text-[20px] text-[#1B1C1A] leading-tight">
                {name}
              </h3>
              <div className="h-1.5 w-8 bg-[#B58D79] mt-4 rounded-full" />
            </div>
            
            {/* Description Body */}
            <div className="max-h-[16rem] overflow-y-auto custom-scrollbar pr-2">
              {description ? (
                <p className="text-[14px] text-[#54433D] font-medium leading-relaxed text-left">
                  {description}
                </p>
              ) : (
                <p className="text-[13px] text-[#904729]/40 italic leading-relaxed text-left">
                  Sin descripción disponible.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
