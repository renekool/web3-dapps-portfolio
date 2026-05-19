"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { type InvoiceFilterType } from "@/components/modern-ui/ProductFilter";
import { Badge } from "@/components/modern-ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/modern-ui/dialog";
import { formatWalletAddress } from "@/lib/utils";
import { InvoicesTable, type Invoice } from "@/components/InvoicesTable";

import { useWallet } from "@/lib/web3/WalletContext";
import { getEcommerceContract, getHttpProvider } from "@/lib/web3/contract";
import { ethers } from "ethers";

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="ml-1 p-0.5 rounded hover:text-foreground transition-colors" title="Copiar">
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function InvoicesPage() {
  const { companyId, signer } = useWallet();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<FilterState>("all");
  const [selected, setSelected] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!companyId) return;
    try {
      const provider = getHttpProvider();
      const contract = getEcommerceContract(signer || provider);
      const invoiceIds = await contract.getInvoicesByCompany(companyId);

      const formatted: Invoice[] = [];
      for (const id of invoiceIds) {
        const inv = await contract.getInvoice(id);

        let paymentData: Invoice["paymentData"] = undefined;
        if (inv.isPaid) {
          const p = await contract.getPayment(id);
          paymentData = {
            paidBy: p.paidBy,
            amount: parseFloat(ethers.formatUnits(p.amount, 6)),
            txHash: p.txHash,
            paidAt: p.paidAt.toString(),
          };
        }

        formatted.push({
          id: id,
          companyId: inv.companyId,
          customerAddress: inv.customerAddress,
          totalAmount: parseFloat(ethers.formatUnits(inv.totalAmount, 6)),
          isPaid: inv.isPaid,
          createdAt: inv.createdAt.toString(),
          items: inv.items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            priceAtPurchase: parseFloat(ethers.formatUnits(item.priceAtPurchase, 6)),
          })),
          paymentData,
        });
      }
      setInvoices(formatted);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  }, [companyId, signer]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Polling: re-fetch cada 10 s para capturar facturas/pagos generados desde web-customer
  useEffect(() => {
    if (!companyId) return;
    const interval = setInterval(fetchInvoices, 10_000);
    return () => clearInterval(interval);
  }, [companyId, fetchInvoices]);

  const allInvoices = invoices;
  const paid    = allInvoices.filter(i => i.isPaid);
  const pending = allInvoices.filter(i => !i.isPaid);
  const totalIngresos = paid.reduce((sum, i) => sum + i.totalAmount, 0);

  const filtered =
    filter === "paid"    ? paid :
    filter === "pending" ? pending :
    allInvoices;

  type FilterState = InvoiceFilterType;

  const METRICS = [
    { label: "Total Facturas", value: allInvoices.length, isAmount: false, color: "text-foreground", type: "all" as const },
    { label: "Pagadas",        value: paid.length,         isAmount: false, color: "text-success",    type: "paid" as const },
    { label: "Pendientes",     value: pending.length,      isAmount: false, color: "text-warning",    type: "pending" as const },
    { label: "Total Ingresos", value: totalIngresos,       isAmount: true,  color: "text-primary",    type: null },
  ];

  return (
    <>
      {/* Header + Metrics */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Facturas</h2>
            <p className="text-sm text-muted-foreground mt-1">Historial de facturas del ecosistema.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRICS.map(({ label, value, isAmount, color, type }) => {
            const isInteractive = type !== null;
            const isActive = isInteractive && filter === type;

            return (
              <div
                key={label}
                onClick={() => isInteractive && setFilter(type)}
                className={`
                  bg-card border rounded-xl px-4 py-3 transition-all duration-200
                  ${isInteractive ? 'cursor-pointer hover:border-primary/40 hover:shadow-sm active:scale-[0.98]' : 'cursor-default'}
                  ${isActive ? 'border-primary ring-1 ring-primary/20 bg-primary/5 shadow-sm' : 'border-border/40'}
                `}
              >
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                {isAmount ? (
                  <p className={`text-2xl font-bold ${color}`}>
                    {(value as number).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-[10px] font-normal ml-1 opacity-60">EURT</span>
                  </p>
                ) : (
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla estable — anchos fijos, sin reflow al filtrar */}
      <InvoicesTable
        invoices={filtered}
        allEmpty={allInvoices.length === 0}
        onSelect={setSelected}
      />

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20 max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  Factura #{selected.id.toString()}
                  <Badge
                    variant={selected.isPaid ? "success" : "warning"}
                    className="text-[10px] font-bold uppercase tracking-wide rounded px-2.5 py-0.5"
                  >
                    {selected.isPaid ? "Pagada" : "Pendiente"}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Cliente */}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
                  <div className="flex items-center gap-1 font-mono text-sm text-foreground">
                    <span>{formatWalletAddress(selected.customerAddress)}</span>
                    <CopyButton text={selected.customerAddress} />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                  <div className="rounded-xl border border-border/40 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/40">
                          <th className="text-left p-3 text-muted-foreground font-bold uppercase tracking-wider">Producto</th>
                          <th className="text-right p-3 text-muted-foreground font-bold uppercase tracking-wider">Qty</th>
                          <th className="text-right p-3 text-muted-foreground font-bold uppercase tracking-wider">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.items.map((item, i) => (
                          <tr key={i} className="border-b border-border/20 last:border-0">
                            <td className="p-3 text-foreground">#{item.productId.toString()}</td>
                            <td className="p-3 text-right text-muted-foreground">{item.quantity}</td>
                            <td className="p-3 text-right font-semibold">{formatAmount(item.priceAtPurchase)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total + Fecha */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Fecha de emisión</p>
                    <p className="text-sm text-foreground">{formatDate(selected.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                    <p className="text-xl font-bold text-foreground">{formatAmount(selected.totalAmount)}</p>
                  </div>
                </div>

                {/* Bloque de pago — solo si isPaid */}
                {selected.isPaid && selected.paymentData && (
                  <div className="rounded-xl bg-success/5 border border-success/20 p-4 space-y-3">
                    <p className="text-[11px] text-success uppercase tracking-wider font-bold">Datos de Pago</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Pagado por</p>
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span>{formatWalletAddress(selected.paymentData.paidBy)}</span>
                          <CopyButton text={selected.paymentData.paidBy} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Monto</p>
                        <p className="font-semibold">{formatAmount(selected.paymentData.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">TxHash</p>
                        <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <span>{formatWalletAddress(selected.paymentData.txHash)}</span>
                          <CopyButton text={selected.paymentData.txHash} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Fecha de pago</p>
                        <p className="text-xs">{formatDate(selected.paymentData.paidAt)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
