import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/modern-ui/badge";
import { Button } from "@/components/modern-ui/button";
import { Card } from "@/components/modern-ui/card";
import { Eye } from "lucide-react";

import { OrderStatus } from "@/lib/contexts/OrdersContext";

interface OrderItemProps {
  id: string;
  amount: number;
  date: string;
  status: OrderStatus;
  onViewDetails: () => void;
  disabled?: boolean;
}

export function OrderItem({ id, amount, date, status, onViewDetails, disabled = false }: OrderItemProps) {
  const dateObj = new Date(date);
  
  // Format: 27 abril 2026
  const formattedDate = dateObj.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Format: 10:36 AM
  const formattedTime = dateObj.toLocaleTimeString("es-ES", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();

  return (
    <Card className={cn("p-6 hover:border-primary/30 transition-all group rounded-2xl bg-white border-[#F2EDE4] shadow-sm hover:shadow-md", disabled && "opacity-80 cursor-not-allowed")}>
      <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-6">
        {/* 1. Orden ID */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Orden ID</span>
          <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {id}
          </span>
        </div>

        {/* 2. Total */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total</span>
          <div className="font-black text-xl text-primary flex items-baseline gap-1">
            <span>{(amount / 1000000).toFixed(2)}</span>
            <span className="text-[11px] opacity-70 uppercase tracking-widest">EURT</span>
          </div>
        </div>

        {/* 3. Fecha */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Fecha</span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">{formattedDate}</span>
            <span className="text-[10px] text-muted-foreground font-medium">{formattedTime}</span>
          </div>
        </div>

        {/* 4. Estado */}
        <div className="flex md:justify-center">
          <Badge 
            variant={
              status === "paid" ? "success" : 
              status === "pending" ? "warning" :
              status === "cancelled" ? "destructive" : "secondary"
            } 
            className="px-6 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm w-fit"
          >
            {
              status === "paid" ? "Pagado" : 
              status === "pending" ? "Pendiente" :
              status === "cancelled" ? "Cancelado" :
              status.charAt(0).toUpperCase() + status.slice(1)
            }
          </Badge>
        </div>

        {/* 5. Acción */}
        <div className="flex md:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            disabled={disabled}
            className="gap-2 text-xs font-bold rounded-xl border-[#DAC1B9] hover:border-primary hover:text-primary transition-all px-5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver Detalles
          </Button>
        </div>
      </div>
    </Card>
  );
}
