"use client";

import { Users } from "lucide-react";
import { Card } from "@/components/modern-ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/modern-ui/table";
import { Badge } from "@/components/modern-ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { formatWalletAddress } from "@/lib/utils";

export interface DerivedCustomer {
  address: string;
  registeredAt: string | null;
  invoiceCount: number;
  totalSpent: number;
  lastPurchase: string;
  invoices: {
    id: string;
    totalAmount: number;
    createdAt: string;
    isPaid: boolean;
  }[];
}

function formatDate(timestamp: string): string {
  if (!timestamp || timestamp === "") return "—";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(amount: number) {
  return (
    <>
      {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      <span className="text-[10px] ml-1 opacity-60 font-normal">EURT</span>
    </>
  );
}

interface CustomersTableProps {
  customers: DerivedCustomer[];
  allEmpty: boolean;
  onSelect: (customer: DerivedCustomer) => void;
}

export function CustomersTable({ customers, allEmpty, onSelect }: CustomersTableProps) {
  if (allEmpty) {
    return (
      <EmptyState
        icon={<Users className="w-9 h-9" />}
        title="Sin clientes"
        description="No se encontraron clientes registrados en el sistema."
      />
    );
  }

  return (
    <Card className="border-border/60 overflow-hidden shadow-sm p-0">
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[15%]" />
          <col className="w-[20%]" />
          <col className="w-[25%]" />
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/40">
            <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50 pl-6">Dirección Wallet</TableHead>
            <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50 text-center">Compras</TableHead>
            <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50">Total Gastado</TableHead>
            <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50 pr-6 text-right">Última Actividad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.address}
              className="group cursor-pointer hover:bg-muted/30 border-border/40 transition-colors"
              onClick={() => onSelect(customer)}
            >
              <TableCell className="py-4 pl-6">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[13.5px] text-foreground">
                    {formatWalletAddress(customer.address)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-tight">
                    Cliente Verificado
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-4 text-center">
                <Badge variant="outline" className="bg-muted/50 font-mono text-[12px] border-border/20">
                  {customer.invoiceCount}
                </Badge>
              </TableCell>
              <TableCell className="py-4 font-semibold text-[14px] text-primary">
                {formatAmount(customer.totalSpent)}
              </TableCell>
              <TableCell className="py-4 pr-6 text-right text-[13px] text-muted-foreground">
                {formatDate(customer.lastPurchase)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
