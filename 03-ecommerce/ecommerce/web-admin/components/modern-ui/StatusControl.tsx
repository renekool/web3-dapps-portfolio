"use client";

import React from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Switch } from "./switch";
import { Edit3 } from "lucide-react";

interface StatusControlProps {
  label?: string;
  showLabel?: boolean;
  status: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  onToggle: (checked: boolean) => void;
  onEdit: () => void;
}

export function StatusControl({
  status,
  activeLabel = "Activa",
  inactiveLabel = "Inactiva",
  onToggle,
  onEdit
}: StatusControlProps) {
  return (
    <div className="flex items-center gap-[10px]">
      <Badge 
        variant={status ? "success" : "secondary"} 
        className="px-[10px] py-[3px] flex items-center transition-all duration-300 rounded-[20px] text-[11px] font-semibold tracking-[0.05em] uppercase border-transparent shadow-none h-auto"
      >
        <span className={`w-[6px] h-[6px] rounded-full mr-[5px] ${status ? 'bg-success-foreground' : 'bg-muted-foreground'}`} />
        {status ? activeLabel : inactiveLabel}
      </Badge>

      <Switch 
        checked={status} 
        onCheckedChange={onToggle}
        className="h-[22px] w-[40px] data-[state=checked]:bg-primary"
      />

      <Button
        variant="outline"
        size="icon"
        className="h-[30px] w-[30px] rounded-[8px] border-border text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-all p-0"
        onClick={onEdit}
      >
        <Edit3 className="w-[15px] h-[15px]" />
      </Button>
    </div>
  );
}
