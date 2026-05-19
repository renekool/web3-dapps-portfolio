"use client";

import React from "react";
import { StatusControl } from "@/components/modern-ui/StatusControl";

interface EntityCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
  mainStat: {
    label: string;
    value: string | number;
    badge?: React.ReactNode;
  };
  status: {
    isActive: boolean;
    activeLabel: string;
    inactiveLabel: string;
    showLabel?: boolean;
    onToggle: () => void;
    onEdit: () => void;
  };
}

export function EntityCard({
  icon,
  title,
  subtitle,
  mainStat,
  status
}: EntityCardProps) {
  return (
    <div className="bg-card border-[1.5px] border-[#E8E0D5] hover:border-[#D6C8B8] transition-all duration-300 rounded-[16px] shadow-[0_2px_10px_rgba(60,30,10,0.04)] hover:shadow-[0_8px_30px_rgba(60,30,10,0.08)] hover:-translate-y-[2px] cursor-default overflow-hidden">
      <div className="p-5 flex flex-col gap-4">
        
        {/* TOP ROW: Identity */}
        <div className="flex items-start gap-3">
          <div className="w-[44px] h-[44px] shrink-0 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground truncate leading-[1.3]">
              {title}
            </h3>
            <div className="mt-[3px] text-[11.5px] text-muted-foreground/60 tracking-[0.03em]">
              {subtitle}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Stats & Controls in specialized box */}
        <div className="bg-muted/40 border border-border/20 rounded-[12px] p-4 flex items-center justify-between gap-2 flex-wrap">
          {/* Left: Main Statistic */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60 mb-[4px]">
              {mainStat.label}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground/90 whitespace-nowrap">
                {mainStat.value}
              </span>
              {mainStat.badge}
            </div>
          </div>

          {/* Right: Integrated Status Controls */}
          <StatusControl
            status={status.isActive}
            activeLabel={status.activeLabel}
            inactiveLabel={status.inactiveLabel}
            onToggle={status.onToggle}
            onEdit={status.onEdit}
          />
        </div>

      </div>
    </div>
  );
}
