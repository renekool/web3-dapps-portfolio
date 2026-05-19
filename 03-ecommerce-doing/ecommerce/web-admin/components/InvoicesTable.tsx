"use client";

import { FileText } from "lucide-react";
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

export interface InvoiceItem {
  productId: bigint;
  quantity: number;
  priceAtPurchase: number;
}

export interface Invoice {
  id: bigint;
  companyId: bigint;
  customerAddress: string;
  totalAmount: number;
  isPaid: boolean;
  createdAt: string; // timestamp as string
  items: InvoiceItem[];
  paymentData?: {
    paidBy: string;
    amount: number;
    txHash: string;
    paidAt: string;
  };
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

interface InvoicesTableProps {
  invoices: Invoice[];
  allEmpty: boolean;
  onSelect: (invoice: Invoice) => void;
}

export function InvoicesTable({ invoices, allEmpty, onSelect }: InvoicesTableProps) {
  if (allEmpty) {
    return (
      <EmptyState
        icon={<FileText className="w-9 h-9" />}
        title="Sin facturas"
        description="No se encontraron facturas registradas en el sistema."
      />
    );
  }

  return (
    <Card className="border-border/60 overflow-hidden shadow-sm p-0">
      {invoices.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No hay facturas que coincidan con el filtro seleccionado.
        </div>
      ) : (
        <Table className="table-fixed">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[30%]" />
            <col className="w-[15%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50 pl-6">ID</TableHead>
              <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50">Cliente</TableHead>
              <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50">Fecha</TableHead>
              <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50">Total</TableHead>
              <TableHead className="h-11 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/50 pr-6 text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id.toString()}
                className="group cursor-pointer hover:bg-muted/30 border-border/40 transition-colors"
                onClick={() => onSelect(invoice)}
              >
                <TableCell className="py-4 pl-6 font-mono text-[12px] text-muted-foreground">
                  #{invoice.id.toString()}
                </TableCell>
                <TableCell className="py-4 font-mono text-[13px] text-foreground">
                  {formatWalletAddress(invoice.customerAddress)}
                </TableCell>
                <TableCell className="py-4 text-[13px] text-muted-foreground">
                  {formatDate(invoice.createdAt)}
                </TableCell>
                <TableCell className="py-4 font-semibold text-[13.5px]">
                  {formatAmount(invoice.totalAmount)}
                </TableCell>
                <TableCell className="py-4 pr-6 text-right">
                  <Badge
                    variant={invoice.isPaid ? "default" : "secondary"}
                    className={invoice.isPaid 
                      ? "bg-green-500/10 text-green-600 border-green-500/20 shadow-none" 
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none"}
                  >
                    {invoice.isPaid ? "Pagada" : "Pendiente"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
