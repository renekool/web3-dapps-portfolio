"use client";

import { useEffect, useRef, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShoppingCart, Trash2, Wallet, ArrowRight, ShieldQuestion, CheckCircle2, Info, Package } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Card } from "@/components/modern-ui/card";
import { Button } from "@/components/modern-ui/button";
import { Badge } from "@/components/modern-ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/modern-ui/dialog";
import { useCart } from "@/lib/contexts/CartContext";
import { useOrders } from "@/lib/contexts/OrdersContext";
import { useWallet } from "@/lib/web3/WalletContext";
import { getEcommerceContract, getEuroTokenContract } from "@/lib/web3/contracts";

const GATEWAY_URL = process.env.NEXT_PUBLIC_PASARELA_URL || "http://localhost:7002";

function CartContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, cartTotal, cartCount, removeItem, updateQuantity, clearCart } = useCart();
  const { isConnected, address, signer, balanceRaw, connect } = useWallet();
  const handledRef = useRef(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [showNoEURTModal, setShowNoEURTModal] = useState(false);
  const [eurtShortfall, setEurtShortfall] = useState<{ balance: string; required: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRedirectOverlay, setShowRedirectOverlay] = useState(false);

  useEffect(() => {
    if (handledRef.current) return;
    const status = searchParams.get("status");
    if (status === "cancelled") {
      handledRef.current = true;
      toast.info("Pago cancelado", {
        description: "Puedes volver a intentarlo desde el catálogo.",
      });
      router.replace("/cart");
    }
  }, [searchParams, router]);

  async function handleCheckout() {
    if (!isConnected) {
      connect();
      return;
    }
    if (items.length === 0) return;

    const targetCompanyId = Array.from(new Set(items.map(i => i.companyId)))[0];
    const firstCompanyItems = items.filter(i => i.companyId === targetCompanyId);
    const requiredRaw = BigInt(
      firstCompanyItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0)
    );

    if (balanceRaw < requiredRaw) {
      const toEurt = (raw: bigint) => (Number(raw) / 1_000_000).toFixed(4);
      setEurtShortfall({
        balance: toEurt(balanceRaw),
        required: toEurt(requiredRaw),
      });
      setShowNoEURTModal(true);
      return;
    }

    setShowCheckoutConfirm(true);
  }

  async function confirmCheckout() {
    if (!signer || !address || items.length === 0) return;
    
    setIsProcessing(true);
    try {
      const contract = getEcommerceContract(signer);
      
      const companyIds = Array.from(new Set(items.map(i => i.companyId)));
      
      toast.loading("Creando factura en blockchain...", { id: "checkout" });
      
      const targetCompanyId = companyIds[0];
      
      const tx = await contract.createInvoice(targetCompanyId);
      const receipt = await tx.wait();
      
      const event = receipt.logs
        .map((log: any) => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((log: any) => log?.name === "InvoiceCreated");

      if (!event) {
        throw new Error("No se pudo encontrar el evento InvoiceCreated");
      }

      const invoiceId = event.args.invoiceId.toString();
      const companyId = event.args.companyId.toString();
      const amount = event.args.totalAmount.toString();
      const company = await contract.getCompanyById(companyId);
      const merchant = company.companyAddress;
      
      toast.success(`Orden #${invoiceId} creada exitosamente`, { id: "checkout" });

      const callbackUrl = window.location.origin;
      const url = new URL(GATEWAY_URL);
      url.searchParams.set("invoiceId", invoiceId);
      url.searchParams.set("companyId", companyId);
      url.searchParams.set("amount", amount);
      url.searchParams.set("merchant", merchant);
      url.searchParams.set("redirect", callbackUrl);

      setShowCheckoutConfirm(false);
      setShowRedirectOverlay(true);

      setTimeout(() => {
        window.location.href = url.toString();
      }, 1500);

    } catch (error: any) {
      console.error("Error creating invoice:", error);
      let errorMsg = "La transacción falló o fue rechazada.";
      
      if (error.reason?.includes("InsufficientStock")) errorMsg = "Lo sentimos, uno de los productos ya no tiene stock suficiente.";
      if (error.reason?.includes("InactiveProduct")) errorMsg = "Uno de los productos ya no está disponible.";
      
      toast.error("Error al procesar el pedido", {
        id: "checkout",
        description: errorMsg,
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleClearCart() {
    setShowClearCartConfirm(true);
  }

  function confirmClearCart() {
    setShowClearCartConfirm(false);
    clearCart();
    toast.info("Carrito vaciado");
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center px-6 h-[calc(100vh-64px)] mt-16">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center shadow-inner">
              <ShoppingCart className="w-8 h-8 text-muted-foreground/60" />
            </div>
          </div>
          <div className="space-y-4 mb-10">
            <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">
              Tu sesión está <span className="text-primary">desconectada</span>
            </h2>
            <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-[320px] mx-auto">
              Conecta tu wallet para poder gestionar tus productos y finalizar la compra de forma segura.
            </p>
          </div>
          <div className="flex justify-center">
            <Button 
              onClick={connect} 
              className="h-14 px-10 text-base font-bold rounded-2xl gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
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

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center px-6 h-[calc(100vh-64px)] mt-16">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="space-y-4 mb-10">
            <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">
              Tu carrito está <span className="text-primary">vacío</span>
            </h2>
            <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-[320px] mx-auto">
              Parece que aún no has añadido nada. ¡Explora nuestro catálogo y descubre productos increíbles!
            </p>
          </div>
          <div className="flex justify-center">
            <Link href="/">
              <Button 
                className="h-14 px-10 text-base font-bold rounded-2xl gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  boxShadow: "0 8px 32px -8px color-mix(in srgb, var(--primary) 40%, transparent)",
                }}
              >
                <ShoppingCart className="w-5 h-5" />
                Explorar Catálogo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const companyIds = Array.from(new Set(items.map(i => i.companyId)));

  return (
    <PageContainer className="relative">
      <div
        className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{
          background: "color-mix(in srgb, var(--primary) 15%, transparent)",
        }}
      />

      <div className="relative flex flex-col gap-12 pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-4 text-center md:text-left max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-foreground">
              Mi <span className="text-primary">carrito</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Tienes <span className="text-primary font-bold">{cartCount} {cartCount === 1 ? "producto" : "productos"}</span> seleccionados para finalizar tu compra.
            </p>
          </div>
          <Link 
            href="/" 
            className="text-sm font-bold text-primary hover:underline underline-offset-4 flex items-center gap-2"
          >
            ← Continuar comprando
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            {companyIds.map(companyId => {
              const companyItems = items.filter(i => i.companyId === companyId);
              const companyName = companyItems[0]?.vendor || `Empresa #${companyId}`;
              
              return (
                <div key={companyId} className="flex flex-col gap-3">
                    {companyItems.map((item) => (
                      <Card key={item.productId} className="p-4 hover:border-primary/30 transition-all group rounded-2xl bg-white border-[#F2EDE4] shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-0.5">
                              {companyName}
                              {companyIds.length > 1 && (
                                <span className="ml-2 normal-case tracking-normal font-semibold text-amber-500/70">· Pedido separado</span>
                              )}
                            </p>
                            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="text-sm font-bold text-primary">
                                {(item.price / 1000000).toFixed(2)} <span className="text-[10px] opacity-60">EURT</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-[#F5F3F0] p-1 rounded-xl border border-[#F2EDE4]">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="h-7 w-7 rounded-lg hover:bg-white"
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="h-7 w-7 rounded-lg hover:bg-white"
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.productId)}
                              className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              );
            })}

            {companyIds.length > 1 && (
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  <strong>Nota de Pago:</strong> Debido a que tus productos pertenecen a diferentes empresas, se generará una factura independiente por cada una. El botón de checkout iniciará el proceso para la primera empresa de la lista.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 p-8 bg-white border border-[#F2EDE4] rounded-[28px] shadow-xl shadow-primary/5">
              <h2 className="text-xl font-bold tracking-tight mb-6 border-b border-[#F2EDE4] pb-4 uppercase">
                Resumen Total
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <div className="font-bold text-foreground flex items-baseline gap-1">
                    <span>{(cartTotal / 1000000).toFixed(2)}</span>
                    <span className="text-[10px] opacity-60 uppercase tracking-wider">EURT</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Empresas</span>
                  <span className="font-bold text-foreground">{companyIds.length}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-end pt-2">
                  <span className="text-lg font-black uppercase tracking-tighter">Total</span>
                  <div className="text-3xl font-black text-primary leading-none flex items-baseline gap-1.5">
                    <span>{(cartTotal / 1000000).toFixed(2)}</span>
                    <span className="text-[14px] opacity-70 uppercase tracking-widest">EURT</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  size="lg" 
                  onClick={handleCheckout} 
                  disabled={isProcessing}
                  className="w-full h-14 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                >
                  {isProcessing ? "Procesando..." : "Proceder al Checkout →"}
                </Button>
                <div className="pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="w-full text-xs font-bold text-muted-foreground hover:text-red-600"
                  >
                    Vaciar mi carrito
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              ¿Crear factura on-chain?
            </DialogTitle>
            <DialogDescription className="text-base mt-2 px-4">
              {companyIds.length > 1 
                ? "Se generará la factura correspondiente a la primera empresa." 
                : "Se generará la factura para completar tu pedido."}
            </DialogDescription>
          </DialogHeader>
          <div className="my-6 p-6 rounded-[24px] bg-muted/40 border border-border/40 text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Total de esta Factura</p>
            <p className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-primary">
                {(items.filter(i => i.companyId === companyIds[0]).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) / 1000000).toFixed(2)}
              </span>
              <span className="text-base font-semibold text-primary/60 uppercase tracking-widest">EURT</span>
            </p>
            <div className="mt-4 pt-4 border-t border-border/40 text-sm text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendedor:</span>
                <span className="font-bold text-primary">{items.filter(i => i.companyId === companyIds[0])[0]?.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productos:</span>
                <span className="font-medium">{items.filter(i => i.companyId === companyIds[0]).length}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button 
              className="w-full h-12 text-base font-bold rounded-2xl"
              onClick={confirmCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? "Confirmando..." : "Confirmar y Pagar"}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-10 text-sm font-medium text-muted-foreground"
              onClick={() => setShowCheckoutConfirm(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty Cart Confirmation Dialog */}
      <Dialog open={showClearCartConfirm} onOpenChange={setShowClearCartConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold text-foreground">¿Vaciar carrito?</DialogTitle>
            <DialogDescription className="text-base mt-2 px-6">
              Esta acción eliminará todos los productos que has seleccionado hasta ahora.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
            <Button 
              variant="destructive"
              className="w-full h-12 text-base font-bold rounded-2xl"
              onClick={confirmClearCart}
            >
              Sí, vaciar carrito
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-10 text-sm font-semibold text-muted-foreground"
              onClick={() => setShowClearCartConfirm(false)}
            >
              Seguir comprando
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redirect to Payment Gateway overlay */}
      <Dialog open={showRedirectOverlay}>
        <DialogContent className="sm:max-w-[360px]" hideClose>
          <div className="py-10 flex flex-col items-center justify-center gap-6">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-primary animate-dots-bounce [animation-delay:-0.3s]"></div>
              <div className="h-3 w-3 rounded-full bg-primary animate-dots-bounce [animation-delay:-0.15s]"></div>
              <div className="h-3 w-3 rounded-full bg-primary animate-dots-bounce"></div>
            </div>
            <DialogHeader className="text-center sm:text-center p-0">
              <DialogTitle className="text-xl font-bold mb-2 text-foreground">Procesando tu pago...</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm max-w-[240px] mx-auto">
                Serás redirigido al gateway de pago en unos instantes.
              </DialogDescription>
            </DialogHeader>
            <p className="text-[11px] text-muted-foreground italic">No cierres esta ventana</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insufficient EURT modal */}
      <Dialog open={showNoEURTModal} onOpenChange={setShowNoEURTModal}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Saldo EURT insuficiente
            </DialogTitle>
            <DialogDescription className="text-base mt-2 px-4 leading-relaxed">
              No tienes suficientes <span className="font-bold text-primary">EuroTokens (EURT)</span> para completar esta compra.
            </DialogDescription>
          </DialogHeader>
          {eurtShortfall && (
            <div className="my-4 p-5 rounded-[20px] bg-muted/40 border border-border/40 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Tu saldo:</span>
                <span className="font-bold text-foreground">{eurtShortfall.balance} EURT</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Necesitas:</span>
                <span className="font-bold text-primary">{eurtShortfall.required} EURT</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Faltan:</span>
                <span className="font-bold text-destructive">
                  {(parseFloat(eurtShortfall.required) - parseFloat(eurtShortfall.balance)).toFixed(4)} EURT
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button
              className="w-full h-12 text-base font-bold rounded-2xl"
              onClick={() => setShowNoEURTModal(false)}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default function CartPage() {
  return (
    <Suspense>
      <CartContent />
    </Suspense>
  );
}
