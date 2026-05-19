"use client";

import React, { useState } from "react";
import { Product } from "@/lib/mock/products";
import { Badge } from "./badge";
import { Switch } from "./switch";
import { Button } from "./button";
import { Edit3, Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onToggle: (id: number) => void;
  onEdit: (product: Product) => void;
}

const T = {
  bg:'#F5F0EA', surface:'#FDFAF7', border:'#E8E0D5',
  terra:'#8B3A2A', terraMid:'#A8432F', terraLt:'#F0E4DF', terraIco:'#C06040',
  text:'#2A1F1A', text2:'#7A6A62', text3:'#B0A090',
  greenBg:'#EAF2E8', greenFg:'#3A7A30',
  grayBg:'#EEEBE7', grayFg:'#8A7A72',
  amberBg:'#FEF3E2', amberFg:'#B45309',
  redBg:'#FDECEA',   redFg:'#C0392B',
};

const LOW_STOCK = 6;

/* ─── ICONS ─── */
const IcBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const IcEdit = ({ color = T.text3 }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IcWarn = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ─── BADGE ─── */
const LocalBadge = ({ type }: { type: 'active' | 'inactive' | 'low' | 'out' }) => {
  const map = {
    active:   { bg:T.greenBg,  fg:T.greenFg,  label:'Activo'   },
    inactive: { bg:T.grayBg,   fg:T.grayFg,   label:'Inactivo' },
    low:      { bg:T.amberBg,  fg:T.amberFg,  label:'Stock bajo'},
    out:      { bg:T.redBg,    fg:T.redFg,    label:'Agotado'  },
  };
  const s = map[type] || map.active;
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-[0.04em] uppercase"
      style={{ background: s.bg, color: s.fg }}
    >
      {type === 'low' ? <IcWarn /> : <span className="w-1.25 h-1.25 rounded-full" style={{ background: s.fg }} />}
      {s.label}
    </span>
  );
};

const StockBar = ({ stock }: { stock: number }) => {
  const pct = Math.min(100, (stock / 50) * 100);
  const color = stock === 0 ? T.redFg : stock <= LOW_STOCK ? T.amberFg : T.greenFg;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: T.grayBg }}>
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-semibold min-w-[22px] text-right" style={{ color }}>{stock}</span>
    </div>
  );
};

const ImgPlaceholder = ({ category }: { category: string }) => {
  const hues: Record<string, string> = { 
    'Ropa': '#F5F0EA', 
    'Calzado': '#F0F2F5', 
    'Accesorios': '#F2F5F0', 
    'Relojes': '#F5F2F0', 
    'Mochilas': '#F0F5F5' 
  };
  const bg = hues[category] || '#F5F3F0';
  return (
    <div 
      className="w-full h-20 rounded-[10px] flex flex-col items-center justify-center gap-1 transition-colors duration-300"
      style={{ background: bg }}
    >
      <div style={{ color: T.terraIco }}>
        <IcBox />
      </div>
    </div>
  );
};

export const ProductCard = ({ product, onToggle, onEdit }: ProductCardProps) => {
  const [hov, setHov] = useState(false);
  const [eHov, setEHov] = useState(false);
  
  const stockType = product.stock === 0 ? 'out' : product.stock <= LOW_STOCK ? 'low' : null;
  const isLowAlert = product.stock > 0 && product.stock <= LOW_STOCK;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={cn(
        "transition-all duration-300 relative overflow-hidden flex flex-col gap-4 p-[18px] bg-card border-[1.5px] rounded-[16px]",
        isLowAlert && !product.isActive ? "border-border" : hov ? "border-[#D5C5B8] shadow-[0_8px_30px_rgba(60,30,10,0.08)] -translate-y-[2px]" : "border-border shadow-[0_2px_10px_rgba(60,30,10,0.04)]"
      )}
    >
      {/* IMAGE ZONE */}
      <ImgPlaceholder category={product.category} />

      {/* NAME + SKU */}
      <div className="space-y-0.5">
        <div 
          className="font-semibold text-[14.5px] text-[#2A1F1A] leading-tight truncate"
          style={{ color: T.text }}
        >
          {product.name}
        </div>
        <div 
          className="text-[10.5px] font-mono tracking-wider"
          style={{ color: T.text3 }}
        >
          {product.sku}
        </div>
      </div>

      {/* PRICE */}
      <div 
        className="text-[20px] font-bold leading-none tracking-tight"
        style={{ color: T.terra }}
      >
        €{product.price.toFixed(2)}
      </div>

      {/* STOCK SECTION in specialized box */}
      <div className="bg-muted/40 border border-border/20 rounded-[12px] p-3.5 -mx-0.5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-muted-foreground/60">
            Stock
          </span>
          {stockType && <LocalBadge type={stockType} />}
        </div>
        <StockBar stock={product.stock} />
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <LocalBadge type={product.isActive ? 'active' : 'inactive'} />
        
        <div className="flex items-center gap-2">
          <Switch 
            checked={product.isActive}
            onCheckedChange={() => onToggle(product.id)}
            className="data-[state=checked]:bg-[#A8432F] data-[state=unchecked]:bg-[#EEEBE7]"
          />
          <button
            onMouseEnter={() => setEHov(true)}
            onMouseLeave={() => setEHov(false)}
            onClick={() => onEdit(product)}
            className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center cursor-pointer transition-all duration-150"
            style={{
              border: `1.5px solid ${eHov ? '#C8B8B0' : T.border}`,
              background: eHov ? T.terraLt : 'transparent',
            }}
          >
            <IcEdit color={eHov ? T.terraIco : T.text3} />
          </button>
        </div>
      </div>
    </div>
  );
};
