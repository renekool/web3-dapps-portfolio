"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Layers, Copy, Check, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  count?: number;
  subtitle?: string;   // display text (may be truncated)
  copyValue?: string;  // full value copied to clipboard (falls back to subtitle)
}

interface FluidDropdownProps {
  categories: Category[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function FluidDropdown({ categories, selectedId, onChange, className }: FluidDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedCategory = categories.find((c) => c.id === selectedId) || categories[0];

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", isOpen ? "z-50" : "z-20", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl shadow-sm hover:border-[#cbd5e1] transition-all duration-200 group"
        style={{ minWidth: "160px" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-1.5 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${selectedCategory.color || "#6366f1"}15` }}
          >
            {selectedCategory.icon && (
              <selectedCategory.icon
                size={16}
                style={{ color: selectedCategory.color || "#6366f1" }}
              />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[14px] font-semibold text-[#1e293b] leading-tight">
              {selectedCategory.label}
            </span>
            {selectedCategory.subtitle && (
              <span className="text-[11px] text-[#94a3b8] font-mono leading-tight whitespace-nowrap">
                {selectedCategory.subtitle}
              </span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-[#94a3b8] group-hover:text-[#64748b]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 w-full mt-2 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden p-1.5 origin-top"
          >
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => {
                  onChange(category.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 group/item cursor-pointer",
                  selectedId === category.id 
                    ? "bg-[#f8fafc]" 
                    : "hover:bg-[#f1f5f9]"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="p-1.5 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover/item:scale-110 shrink-0"
                    style={{ backgroundColor: `${category.color || "#6366f1"}15` }}
                  >
                    <category.icon
                      size={16}
                      style={{ color: category.color || "#6366f1" }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={cn(
                      "text-[14px] transition-colors duration-200 leading-tight",
                      selectedId === category.id
                        ? "font-bold text-[#1e293b]"
                        : "font-medium text-[#64748b] group-hover/item:text-[#334155]"
                    )}>
                      {category.label}
                    </span>
                    {category.subtitle && (
                      <span className="text-[11px] text-[#94a3b8] font-mono leading-tight whitespace-nowrap">
                        {category.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                {category.subtitle && (
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, category.copyValue ?? category.subtitle!, category.id)}
                    className="shrink-0 p-1 rounded-md hover:bg-[#e2e8f0] transition-colors duration-150"
                    title="Copiar dirección"
                  >
                    {copiedId === category.id
                      ? <Check size={12} className="text-[#10b981]" />
                      : <Copy size={12} className="text-[#94a3b8]" />
                    }
                  </button>
                )}
                {category.count !== undefined && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#94a3b8] shrink-0">
                    {category.count}
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
