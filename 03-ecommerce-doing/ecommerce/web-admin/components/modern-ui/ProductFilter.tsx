"use client";

import React, { useState, useRef, useEffect } from "react";
import { Layers, CheckCircle2, XCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterType = "all" | "active" | "inactive" | "low";
export type InvoiceFilterType = "all" | "paid" | "pending";

interface ProductFilterProps {
  currentFilter: FilterType;
  counts: Record<FilterType, number>;
  onFilterChange: (filter: FilterType) => void;
}

const T = {
  bg:'#F5F0EA', surface:'#FDFAF7', border:'#E8E0D5',
  terra:'#8B3A2A', terraMid:'#A8432F', terraLt:'#F0E4DF', terraIco:'#C06040',
  text:'#2A1F1A', text2:'#7A6A62', text3:'#B0A090',
};

/* ─── ICONS ─── */
const IcLayers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);

const IcChevron = ({ open }: { open: boolean }) => (
  <svg 
    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={cn("transition-transform duration-200", open ? "rotate-180" : "")}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IcFilter = ({ type }: { type: FilterType }) => {
  const icons = {
    all:      <IcLayers/>,
    active:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    inactive: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    low:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  };
  return icons[type] || icons.all;
};

const IcInvoiceFilter = ({ type }: { type: InvoiceFilterType }) => {
  const icons: Record<InvoiceFilterType, React.ReactNode> = {
    all:     <IcLayers/>,
    paid:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    pending: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  };
  return icons[type] || icons.all;
};

interface InvoiceFilterProps {
  currentFilter: InvoiceFilterType;
  counts: Record<InvoiceFilterType, number>;
  onFilterChange: (filter: InvoiceFilterType) => void;
}

export const InvoiceFilter = ({ currentFilter, counts, onFilterChange }: InvoiceFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { key: InvoiceFilterType; label: string }[] = [
    { key: "all",     label: "Todas" },
    { key: "paid",    label: "Pagadas" },
    { key: "pending", label: "Pendientes" },
  ];

  const currentLabel = options.find(o => o.key === currentFilter)?.label;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2.5 px-4 h-12 rounded-xl border transition-all duration-200 cursor-pointer text-[13.5px] font-semibold whitespace-nowrap",
          isOpen
            ? "bg-primary/5 border-primary/30 text-primary shadow-sm"
            : "bg-muted/40 border-border/40 text-foreground hover:bg-muted/60"
        )}
      >
        <span className={cn("transition-colors", isOpen ? "text-primary" : "text-muted-foreground/60")}>
          <IcInvoiceFilter type={currentFilter}/>
        </span>
        {currentLabel}
        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {counts[currentFilter]}
        </span>
        <span className={cn("ml-1 transition-colors", isOpen ? "text-primary/60" : "text-muted-foreground/30")}>
          <IcChevron open={isOpen}/>
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-card border border-border/50 rounded-2xl p-1.5 min-w-[180px] shadow-2xl animate-in fade-in zoom-in duration-200">
          {options.map((opt, i) => (
            <React.Fragment key={opt.key}>
              {i === 1 && <div className="h-[1px] bg-border/20 my-1 mx-2" />}
              <button
                onClick={() => { onFilterChange(opt.key); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer",
                  currentFilter === opt.key ? "bg-primary/8 text-primary font-bold" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(currentFilter === opt.key ? "text-primary" : "text-muted-foreground/40")}>
                    <IcInvoiceFilter type={opt.key}/>
                  </span>
                  <span className="text-[13.5px]">{opt.label}</span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-lg",
                  currentFilter === opt.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground/60"
                )}>
                  {counts[opt.key]}
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductFilter = ({ currentFilter, counts, onFilterChange }: ProductFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "inactive", label: "Inactivos" },
    { key: "low", label: "Stock bajo" },
  ];

  const currentLabel = options.find(o => o.key === currentFilter)?.label;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      {/* Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={cn(
          "flex items-center gap-2.5 px-4 h-12 rounded-xl border transition-all duration-200 cursor-pointer text-[13.5px] font-semibold whitespace-nowrap",
          isOpen 
            ? "bg-primary/5 border-primary/30 text-primary shadow-sm" 
            : "bg-muted/40 border-border/40 text-foreground hover:bg-muted/60"
        )}
      >
        <span className={cn("transition-colors", isOpen ? "text-primary" : "text-muted-foreground/60")}>
          <IcFilter type={currentFilter}/>
        </span>
        {currentLabel}
        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {counts[currentFilter]}
        </span>
        <span className={cn("ml-1 transition-colors", isOpen ? "text-primary/60" : "text-muted-foreground/30")}>
          <IcChevron open={isOpen}/>
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border/50 rounded-2xl p-1.5 min-w-[180px] shadow-2xl animate-in fade-in zoom-in duration-200">
          {options.map((opt, i) => (
            <React.Fragment key={opt.key}>
              {i === 1 && <div className="h-[1px] bg-border/20 my-1 mx-2" />}
              <button 
                onClick={() => { onFilterChange(opt.key); setIsOpen(false); }} 
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer",
                  currentFilter === opt.key ? "bg-primary/8 text-primary font-bold" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(currentFilter === opt.key ? "text-primary" : "text-muted-foreground/40")}>
                    <IcFilter type={opt.key}/>
                  </span>
                  <span className="text-[13.5px]">
                    {opt.label}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-lg",
                  currentFilter === opt.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground/60"
                )}>
                  {counts[opt.key]}
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
