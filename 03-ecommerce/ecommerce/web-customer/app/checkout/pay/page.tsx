"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { Card } from "@/components/modern-ui/card";
import { Button } from "@/components/modern-ui/button";
import { Badge } from "@/components/modern-ui/badge";
import { Wallet, CreditCard, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { useWallet } from "@/lib/web3/WalletContext";
import { getEcommerceContract, getEuroTokenContract } from "@/lib/web3/contracts";
import { formatEURT } from "@/lib/web3/formatters";
import Link from "next/link";
import { cn } from "@/lib/utils";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isConnected, address, signer, connect, refreshBalance } = useWallet();
  
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [balance, setBalance] = useState<bigint>(0n);
  const [isPending, setIsPending] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("invoice");
    if (id) setInvoiceId(id);
    else setError("No se proporcionó un ID de factura válido.");
  }, [searchParams]);

  useEffect(() => {
    if (isConnected && signer && invoiceId) {
      loadData();
    }
  }, [isConnected, signer, invoiceId]);

  async function loadData() {
    if (!signer || !invoiceId) return;
    setIsPending(true);
    setError(null);
    try {
      const ecommerce = getEcommerceContract(signer);
      const euroToken = getEuroTokenContract(signer);
      
      const inv = await ecommerce.getInvoice(invoiceId);
      setInvoiceData(inv);

      const bal = await euroToken.balanceOf(address);
      setBalance(bal);

      if (inv.isPaid) {
        setError("Esta factura ya ha sido procesada.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar los datos de la factura.");
    } finally {
      setIsPending(false);
    }
  }

  async function handlePay() {
    if (!signer || !invoiceData) return;
    
    setIsProcessing(true);
    const ecommerce = getEcommerceContract(signer);
    const euroToken = getEuroTokenContract(signer);
    const ecommerceAddr = await ecommerce.getAddress();

    try {
      // 1. Approve
      toast.loading("Aprobando EuroTokens...", { id: "pay" });
      const approveTx = await euroToken.approve(ecommerceAddr, invoiceData.totalAmount);
      await approveTx.wait();

      // 2. Process Payment
      toast.loading("Procesando pago...", { id: "pay" });
      const payTx = await ecommerce.processPayment(invoiceId);
      await payTx.wait();
      await refreshBalance();

      toast.success("¡Pago completado exitosamente!", { id: "pay" });
      
      // Redirect to success view in orders
      router.push(`/orders?status=success&invoice=${invoiceId}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Error en el pago", { 
        id: "pay", 
        description: err.reason || "La transacción fue rechazada o falló." 
      });
    } finally {
      setIsProcessing(false);
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-40" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Consultando blockchain...</p>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Vaya, algo salió mal</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">{error || "No pudimos recuperar la información."}</p>
        </div>
        <Link href="/cart">
          <Button variant="outline" className="rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Carrito
          </Button>
        </Link>
      </div>
    );
  }

  const hasBalance = balance >= invoiceData.totalAmount;

  return (
    <PageContainer>
      <div className="max-w-xl mx-auto py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-4xl font-black tracking-tighter">Confirmar <span className="text-primary">Pago</span></h1>
          <p className="text-muted-foreground">Estás pagando directamente desde la Web del Cliente.</p>
        </div>

        <Card className="p-8 bg-white border-[#F2EDE4] rounded-[32px] shadow-2xl shadow-primary/5">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between pb-6 border-b border-[#F2EDE4]">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Factura</p>
                <h2 className="text-xl font-bold">#{invoiceId}</h2>
              </div>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 uppercase font-black px-4 py-1.5 rounded-full">
                Pendiente de Pago
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Importe Total</span>
                <span className="text-3xl font-black text-primary">{formatEURT(invoiceData.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/40 rounded-2xl border border-border/40">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Tu Saldo</p>
                    <p className={cn("text-sm font-bold", !hasBalance && "text-red-600")}>
                      {formatEURT(balance)}
                    </p>
                  </div>
                </div>
                {!hasBalance && (
                  <Badge variant="destructive" className="rounded-lg text-[10px] font-black uppercase">
                    Saldo Insuficiente
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button 
                onClick={handlePay}
                disabled={!hasBalance || isProcessing}
                className="w-full h-16 rounded-2xl text-base font-bold shadow-xl shadow-primary/20"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Pagar Ahora con EuroTokens <CreditCard className="ml-2 w-5 h-5" /></>
                )}
              </Button>
              
              <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-[10px] text-blue-800 font-medium leading-tight">
                  Al pulsar el botón, firmarás dos transacciones: una para aprobar el gasto y otra para ejecutar el pago.
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="text-center">
          <Link href="/cart" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            Cancelar y volver al carrito
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

export default function InternalPaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  );
}
