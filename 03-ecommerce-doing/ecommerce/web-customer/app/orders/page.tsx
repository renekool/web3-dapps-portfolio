"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClipboardList, Wallet, ArrowRight, Eye, Calendar, Hash, CreditCard } from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { Card } from "@/components/modern-ui/card";
import { Badge } from "@/components/modern-ui/badge";
import { Button } from "@/components/modern-ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/modern-ui/dialog";
import { useOrders, Order, OrderStatus } from "@/lib/contexts/OrdersContext";
import { useWallet } from "@/lib/web3/WalletContext";
import { OrderItem } from "@/components/modern-ui/order-item";

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { orders, updateOrderStatus } = useOrders();
  const { isConnected, connect, refreshBalance, address } = useWallet();
  const handledRef = useRef(false);
  const [awaitingBalanceRefresh, setAwaitingBalanceRefresh] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mark order as paid exactly once when ?status=success is detected
  useEffect(() => {
    if (handledRef.current) return;
    const status = searchParams.get("status");
    const invoice = searchParams.get("invoice");
    if (status === "success" && invoice) {
      handledRef.current = true;
      updateOrderStatus(invoice, "paid");
      setAwaitingBalanceRefresh(true);
      toast.success("Pago confirmado", {
        description: `Orden ${invoice} marcada como pagada.`,
      });
      router.replace("/orders");
    }
  }, [searchParams, updateOrderStatus, router]);

  // Refresh balance once address is available (handles fresh-page-load race condition)
  useEffect(() => {
    if (!awaitingBalanceRefresh || !address) return;
    refreshBalance();
    setAwaitingBalanceRefresh(false);
  }, [awaitingBalanceRefresh, address, refreshBalance]);



  if (!isConnected) {
    return (
      <div className="flex items-center justify-center px-6 h-[calc(100vh-64px)] mt-16">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center shadow-inner">
              <ClipboardList className="w-8 h-8 text-muted-foreground/60" />
            </div>
          </div>
          <div className="space-y-4 mb-10">
            <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">
              Conecta tu <span className="text-primary">Wallet</span>
            </h2>
            <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-[320px] mx-auto">
              Necesitas una wallet conectada para ver tus órdenes de forma segura en la blockchain.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={connect}
              className="h-14 px-10 text-base font-bold rounded-2xl gap-3 transition-all"
              style={{
                boxShadow: "0 8px 32px -8px color-mix(in srgb, var(--primary) 40%, transparent)",
              }}
            >
              <Wallet className="w-5 h-5" />
              Conectar Wallet
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <PageContainer className="relative">
        {/* Ambient glow — Premium touch */}
        <div
          className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{
            background: "color-mix(in srgb, var(--primary) 15%, transparent)",
          }}
        />

        <div className="relative flex flex-col gap-12 pt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            {/* Hero Section */}
            <div className="flex flex-col gap-4 text-center md:text-left max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-foreground">
                Mis <span className="text-primary">órdenes</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl line-clamp-1">
                Revisa y gestiona tus órdenes de forma clara y rápida.
              </p>
            </div>
          </div>

        <div className="text-center py-20 px-6 bg-[#FDFCFB]/50 rounded-3xl border border-dashed border-[#DAC1B9]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 mb-6">
            <ClipboardList className="w-8 h-8 text-primary/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Aún no tienes órdenes</h3>
          <p className="text-muted-foreground font-medium max-w-[300px] mx-auto mb-8 text-sm">
            Tus compras aparecerán aquí una vez que se confirmen en la blockchain.
          </p>
          <Link href="/">
            <Button variant="outline" className="font-bold rounded-xl px-8 h-12 border-[#DAC1B9] hover:bg-primary/5 transition-all">
              Explorar Catálogo
            </Button>
          </Link>
        </div>
          </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="relative">
      {/* Ambient glow — Premium touch */}
      <div
        className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{
          background: "color-mix(in srgb, var(--primary) 15%, transparent)",
        }}
      />

      <div className="relative flex flex-col gap-12 pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Hero Section */}
          <div className="flex flex-col gap-4 text-center md:text-left max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-foreground">
              Mis <span className="text-primary">órdenes</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl line-clamp-1">
              Revisa y gestiona tus órdenes de forma clara y rápida.
            </p>
          </div>
          <Link 
            href="/" 
            className="text-sm font-bold text-primary hover:underline underline-offset-4 flex items-center gap-2"
          >
            ← Seguir comprando
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {[...orders].reverse().map((order) => (
            <OrderItem
              key={order.id}
              id={order.id}
              amount={order.amount}
              date={order.date}
              status={order.status}
              onViewDetails={() => setSelectedOrder(order as Order)}
            />
          ))}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tighter">
              Detalles de Orden
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="flex flex-col gap-5 pt-2">
              <div className="flex items-start gap-3 p-4 bg-[#FBF9F6] rounded-xl border border-[#F2EDE4]">
                <Hash className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Número de Orden</p>
                  <p className="text-base font-black text-foreground">{selectedOrder.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-[#FBF9F6] rounded-xl border border-[#F2EDE4]">
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Fecha</p>
                  <p className="text-base font-semibold text-foreground">
                    {new Date(selectedOrder.date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })} a las {new Date(selectedOrder.date).toLocaleTimeString("es-ES", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    }).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-[#FBF9F6] rounded-xl border border-[#F2EDE4]">
                <CreditCard className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Total</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-primary">{(selectedOrder.amount / 1000000).toFixed(2)}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">EURT</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#FBF9F6] rounded-xl border border-[#F2EDE4]">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado</p>
                <Badge
                  variant={
                    selectedOrder.status === "paid" ? "success" : 
                    selectedOrder.status === "pending" ? "warning" :
                    selectedOrder.status === "cancelled" ? "destructive" : "secondary"
                  }
                  className="px-4 py-1 text-[10px] font-black uppercase tracking-wider rounded-full"
                >
                  {
                    selectedOrder.status === "paid" ? "Pagado" : 
                    selectedOrder.status === "pending" ? "Pendiente" :
                    selectedOrder.status === "cancelled" ? "Cancelado" :
                    selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)
                  }
                </Badge>
              </div>

              <Button
                onClick={() => setSelectedOrder(null)}
                className="w-full h-11 rounded-xl font-bold text-sm mt-1"
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}
