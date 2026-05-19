"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Badge } from "@/components/modern-ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/modern-ui/dialog";
import { formatWalletAddress } from "@/lib/utils";
import { CustomersTable, type DerivedCustomer } from "@/components/CustomersTable";

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
    <button
      onClick={handleCopy}
      className="ml-1 p-0.5 rounded hover:text-foreground transition-colors"
      title="Copiar"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-success" />
        : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function CustomersPage() {
  const { companyId, signer } = useWallet();
  const [customers, setCustomers] = useState<DerivedCustomer[]>([]);
  const [selected, setSelected] = useState<DerivedCustomer | null>(null);

  const fetchAndDeriveCustomers = useCallback(async () => {
    if (!companyId) return;
    try {
      const provider = getHttpProvider();
      const contract = getEcommerceContract(signer || provider);
      const invoiceIds = await contract.getInvoicesByCompany(companyId);
      const invoices: any[] = [];
      for (const id of invoiceIds) {
        const inv = await contract.getInvoice(id);
        invoices.push({
          id: id,
          customerAddress: inv.customerAddress,
          totalAmount: inv.totalAmount,
          isPaid: inv.isPaid,
          createdAt: inv.createdAt,
        });
      }

      const uniqueAddresses = [...new Set(invoices.map((i: any) => i.customerAddress as string))];

      const derived: DerivedCustomer[] = await Promise.all(
        uniqueAddresses.map(async (addr) => {
          const customerInvoices = invoices.filter((i: any) => i.customerAddress === addr);
          const paidInvoices = customerInvoices.filter((i: any) => i.isPaid);
          const totalSpent = paidInvoices.reduce(
            (sum: number, i: any) => sum + parseFloat(ethers.formatUnits(i.totalAmount, 6)),
            0
          );
          const sorted = [...customerInvoices].sort((a: any, b: any) => Number(b.createdAt) - Number(a.createdAt));
          const lastPurchase = sorted[0]?.createdAt.toString() ?? "";

          let registeredAt: string | null = null;
          try {
            const customer = await contract.getCustomer(addr);
            registeredAt = customer.registeredAt.toString();
          } catch {
            // cliente aún no registrado explícitamente en el SC
          }

          return {
            address: addr,
            registeredAt,
            invoiceCount: customerInvoices.length,
            totalSpent,
            lastPurchase,
            invoices: customerInvoices.map((inv: any) => ({
              id: inv.id.toString(),
              totalAmount: parseFloat(ethers.formatUnits(inv.totalAmount, 6)),
              createdAt: inv.createdAt.toString(),
              isPaid: inv.isPaid,
            })),
          };
        })
      );

      setCustomers(derived);
    } catch (err) {
      console.error("Error fetching/deriving customers:", err);
    }
  }, [companyId, signer]);

  useEffect(() => {
    fetchAndDeriveCustomers();
  }, [fetchAndDeriveCustomers]);

  // Polling: re-fetch cada 10 s para capturar nuevos clientes desde web-customer
  useEffect(() => {
    if (!companyId) return;
    const interval = setInterval(fetchAndDeriveCustomers, 10_000);
    return () => clearInterval(interval);
  }, [companyId, fetchAndDeriveCustomers]);

  const totalIngresos = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const promedio = customers.length > 0 ? totalIngresos / customers.length : 0;

  const METRICS = [
    { label: "Total Clientes",      value: customers.length, isAmount: false, color: "text-foreground" },
    { label: "Total Ingresos",      value: totalIngresos,    isAmount: true,  color: "text-primary" },
    { label: "Promedio por Cliente",value: promedio,         isAmount: true,  color: "text-muted-foreground" },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Clientes</h2>
            <p className="text-sm text-muted-foreground mt-1">Clientes registrados en el ecosistema.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {METRICS.map(({ label, value, isAmount, color }) => (
            <div
              key={label}
              className="bg-card border border-border/40 rounded-xl px-4 py-3"
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
          ))}
        </div>
      </div>

      <CustomersTable
        customers={customers}
        allEmpty={customers.length === 0}
        onSelect={setSelected}
      />

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20 max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight font-mono">
                  {formatWalletAddress(selected.address)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Wallet */}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Wallet</p>
                  <div className="flex items-center gap-1 font-mono text-sm text-foreground">
                    <span>{formatWalletAddress(selected.address)}</span>
                    <CopyButton text={selected.address} />
                  </div>
                </div>

                {/* Fecha de registro */}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Registro</p>
                  <p className="text-sm text-foreground">
                    {selected.registeredAt ? formatDate(selected.registeredAt) : "—"}
                  </p>
                </div>

                {/* Resumen */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Total Facturas</p>
                    <p className="text-2xl font-bold text-foreground">{selected.invoiceCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Total Gastado</p>
                    <p className="text-xl font-bold text-foreground">{formatAmount(selected.totalSpent)}</p>
                  </div>
                </div>

                {/* Historial de facturas */}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Historial de Facturas</p>
                  <div className="rounded-xl border border-border/40 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/40">
                          <th className="text-left p-3 text-muted-foreground font-bold uppercase tracking-wider">#</th>
                          <th className="text-right p-3 text-muted-foreground font-bold uppercase tracking-wider">Monto</th>
                          <th className="text-left p-3 text-muted-foreground font-bold uppercase tracking-wider">Fecha</th>
                          <th className="text-left p-3 text-muted-foreground font-bold uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.invoices
                          .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
                          .map((inv) => (
                            <tr key={inv.id} className="border-b border-border/20 last:border-0">
                              <td className="p-3 font-mono text-muted-foreground">#{inv.id}</td>
                              <td className="p-3 text-right font-semibold text-foreground">{formatAmount(inv.totalAmount)}</td>
                              <td className="p-3 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                              <td className="p-3">
                                <Badge
                                  variant={inv.isPaid ? "success" : "warning"}
                                  className="text-[10px] font-bold uppercase tracking-wide rounded px-2.5 py-0.5"
                                >
                                  {inv.isPaid ? "Pagada" : "Pendiente"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
