"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JsonRpcProvider, Contract, formatUnits } from "ethers";
import { useCompraState } from "@/lib/hooks/use-compra-state";
import { toast, Toaster } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Switch } from "@/components/modern-ui/switch";
import { Label } from "@/components/modern-ui/label";
import {
  ArrowRight,
  Info,
  Lock,
  Zap,
  RefreshCw,
  CheckCircle2,
  Wallet,
  TrendingUp,
  ChevronDown,
  Copy,
  Check,
  LogOut,
  CreditCard,
  Shield,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/modern-ui/button";
import { cn, formatAddress } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/modern-ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/modern-ui/tooltip";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_AMOUNT = 10;
const QUICK_AMOUNTS = [20, 50, 100, 200, 500];

const ABIS = {
  EuroToken: [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ]
};

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Page ─────────────────────────────────────────────────────────────────────

import { useWallet } from "@/lib/web3/WalletContext";

export default function CompraActivoPage() {
  const router = useRouter();
  const { address, balance, status, disconnectWallet } = useWallet();

  // ── Wallet & State Machine ────────────────────────────────────────────────
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [localStep, setLocalStep] = useState<2 | 3>(2);
  const [saveCard, setSaveCard] = useState(false);

  const {
    step,
    error: stateError,
    transitionTo,
    handleError,
    isProcessing,
  } = useCompraState();


  // ── Route Guards ──────────────────────────────────────────────────────────



  // ── Step 2: monto ─────────────────────────────────────────────────────────
  const [rawAmount, setRawAmount] = useState("");

  const amount = parseFloat(rawAmount) || 0;
  const isAmountValid = rawAmount !== "" && amount >= MIN_AMOUNT;
  const eurtAmount = amount;
  const hasError = rawAmount !== "" && !isAmountValid;

  const handleAmountChange = (val: string) => {
    const filtered = val.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setRawAmount(filtered);
  };

  const handleAmountBlur = () => {
    // No longer strictly needed for error display but kept for potential focus styles
  };




  if (status === "no-wallet") {
    return (
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-card border border-border shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">MetaMask es necesario</h2>
          <p className="text-muted-foreground mb-8">
            Para cargar saldo y operar en <span className="text-primary">Viva</span><span className="text-[#000000]">Pay</span> necesitas una billetera Web3 instalada.
          </p>
          <Button asChild className="w-full h-12 rounded-xl text-base font-bold">
            <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
              Instalar MetaMask <ExternalLink className="ml-2 w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "unsupported-network") {
    return (
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-card border border-border shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-8 h-8 text-destructive animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Red incorrecta</h2>
          <p className="text-muted-foreground mb-8">
            Estás conectado a una red no soportada. Por favor, cambia a <strong>Anvil (Localhost 8545)</strong> en tu billetera.
          </p>
          <div className="p-4 rounded-xl bg-muted text-xs font-mono text-left mb-6">
            Chain ID esperado: 31337
          </div>
        </div>
      </div>
    );
  }

  if (status === "connecting") return null;


  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateIntent = async () => {
    if (!address || !isAmountValid) return;
    transitionTo('creating-intent');
    const toastId = toast.loading("Iniciando pago...");

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: Math.round(amount * 100),
          walletAddress: address,
          setupFutureUsage: saveCard,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear intención de pago');

      setClientSecret(data.clientSecret);
      transitionTo('ready-to-pay');
      setLocalStep(3);
      toast.success("Listo para pagar", { id: toastId });
    } catch (err: any) {
      handleError(err.message);
      toast.error(err.message, { id: toastId });
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">

      {/* ── Background decorative orbs ── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/2 -left-60 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[100px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[80px]" />
      </div>
      <Nav />

      <main
        id="main-content"
        className="relative z-10 pt-[120px] pb-24 px-4 sm:px-6 max-w-[960px] mx-auto w-full flex-1"
      >
        <PageHeader step={localStep} onBack={localStep === 3 ? () => setLocalStep(2) : undefined} />

        <div className="mt-6">
          {localStep === 3 && clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <Step3Content
                amount={amount}
                eurtAmount={eurtAmount}
                clientSecret={clientSecret}
                saveCard={saveCard}
                setSaveCard={setSaveCard}
                address={address || null}
              />
            </Elements>
          ) : (
            <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
              <div className="w-full lg:w-[56%] flex flex-col">
                <ExchangeWidget
                  rawAmount={rawAmount}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  hasError={hasError}
                  isAmountValid={isAmountValid}
                  amount={amount}
                  eurtAmount={eurtAmount}
                />
              </div>

              <aside className="w-full lg:w-[44%] lg:sticky lg:top-[96px] flex flex-col">
                <OrderPanel
                  amount={amount}
                  eurtAmount={eurtAmount}
                  isAmountValid={isAmountValid}
                  isProcessing={isProcessing}
                  onSubmit={handleCreateIntent}
                />
              </aside>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}

// ─── Step 3 Content (Unified Modal Logic) ───────────────────────────────────

type ModalStep = 'idle' | 'confirming' | 'processing' | 'success' | 'failed' | 'timeout';

function Step3Content({
  amount,
  eurtAmount,
  clientSecret,
  saveCard,
  setSaveCard,
  address
}: {
  amount: number;
  eurtAmount: number;
  clientSecret: string;
  saveCard: boolean;
  setSaveCard: (v: boolean) => void;
  address: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<ModalStep>('idle');
  const [copied, setCopied] = useState(false);
  const [piId, setPiId] = useState<string | null>(null);

  const handlePayClick = async () => {
    if (!stripe || !elements) return;
    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast.error(submitError.message);
      return;
    }
    setModalStatus('confirming');
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setModalStatus('processing');

    try {
      const { paymentIntent, error } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required'
      });

      if (error) throw new Error(error.message);

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPiId(paymentIntent.id);
        startPolling(paymentIntent.id);
      } else {
        throw new Error("El pago no pudo completarse. Estado: " + (paymentIntent?.status || 'desconocido'));
      }
    } catch (err: any) {
      toast.error(err.message);
      setModalStatus('idle');
      setModalOpen(false);
    }
  };

  const startPolling = (paymentIntentId: string) => {
    let elapsed = 0;
    const TIMEOUT = 45_000;
    const INTERVAL = 3_000;

    const intervalId = setInterval(async () => {
      elapsed += INTERVAL;
      if (elapsed > TIMEOUT) {
        clearInterval(intervalId);
        setModalStatus('timeout');
        return;
      }

      try {
        const res = await fetch(`/api/mint-status?piId=${paymentIntentId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'MINT_SUCCESS') {
          clearInterval(intervalId);
          setModalStatus('success');
          // Dispatch event to update balance in background if needed
          window.dispatchEvent(new CustomEvent('update-balance'));
        } else if (data.status === 'PAGADO_PENDIENTE_MINT') {
          clearInterval(intervalId);
          setModalStatus('failed');
        }
      } catch {
        // Continue polling
      }
    }, INTERVAL);
  };

  const copyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    toast.success("Contrato copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReturnToStart = () => {
    window.location.href = 'http://localhost:7001/compra';
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
        <div className="w-full lg:w-[56%] flex flex-col">
          <div className="rounded-2xl border border-border/50 bg-white shadow-lg shadow-border/10 overflow-hidden flex flex-1 p-5 flex-col">
            <PaymentElement />
            <div className="mt-6 pt-6 border-t border-border/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="save-card" className="text-sm font-bold">Guardar tarjeta</Label>
                <p className="text-[10px] text-muted-foreground">Para futuras transacciones rápidas</p>
              </div>
              <Switch id="save-card" checked={saveCard} onCheckedChange={setSaveCard} />
            </div>
          </div>
        </div>
        <aside className="w-full lg:w-[44%] lg:sticky lg:top-[96px] flex flex-col">
          <PaymentSummaryPanel amount={amount} eurtAmount={eurtAmount} onPay={handlePayClick} />
        </aside>
      </div>

      <Dialog 
        open={modalOpen} 
        onOpenChange={(open) => {
          if (modalStatus === 'confirming' && !open) setModalOpen(false);
        }}
      >
        <DialogContent 
          className="sm:max-w-[440px]" 
          hideClose={modalStatus !== 'confirming'}
          onPointerDownOutside={(e) => { if (modalStatus !== 'confirming') e.preventDefault() }}
          onEscapeKeyDown={(e) => { if (modalStatus !== 'confirming') e.preventDefault() }}
        >
          {/* A. CONFIRMATION */}
          {modalStatus === 'confirming' && (
            <>
              <DialogHeader className="text-center sm:text-center">
                <DialogTitle className="text-2xl font-bold text-foreground">¿Confirmar transacción?</DialogTitle>
                <DialogDescription className="text-sm mt-1">Estás a punto de enviar fondos a tu billetera</DialogDescription>
              </DialogHeader>

              <div className="my-2 p-5 rounded-2xl bg-muted/40 border border-border/30 text-center">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Monto a enviar</p>
                <p className="text-4xl font-extrabold text-primary font-[family-name:var(--font-sans)]">{eurtAmount.toFixed(2)} EURT</p>
                <div className="mt-4 pt-4 border-t border-border/30 text-sm text-left space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Wallet destino</span>
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/20">{formatAddress(address)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Red</span>
                    <span className="font-semibold text-xs text-foreground">Anvil Network</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Comisión</span>
                    <span className="font-semibold text-xs text-success">0.00 EUR</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-col gap-2.5">
                <Button className="w-full h-12 text-base font-bold rounded-xl cursor-pointer" onClick={handleConfirm}>
                  Confirmar y pagar
                </Button>
                <DialogClose asChild>
                  <Button variant="ghost" className="w-full h-10 text-sm font-medium text-muted-foreground cursor-pointer">
                    Cancelar operación
                  </Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}

          {/* B. PROCESSING */}
          {modalStatus === 'processing' && (
            <div className="py-10 flex flex-col items-center justify-center gap-6">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-primary animate-dots-bounce [animation-delay:-0.3s]"></div>
                <div className="h-3 w-3 rounded-full bg-primary animate-dots-bounce [animation-delay:-0.15s]"></div>
                <div className="h-3 w-3 rounded-full bg-primary animate-dots-bounce"></div>
              </div>
              <DialogHeader className="text-center sm:text-center p-0">
                <DialogTitle className="text-xl font-bold mb-2 text-foreground">Procesando tu pago...</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm max-w-[240px] mx-auto text-center leading-relaxed">
                  Esto puede tardar unos segundos dependiendo del estado de la red.
                </DialogDescription>
              </DialogHeader>
              <p className="text-[11px] text-muted-foreground italic mt-2 animate-pulse">No cierres esta ventana</p>
            </div>
          )}

          {/* C. SUCCESS */}
          {modalStatus === 'success' && (
            <>
              <div className="flex justify-center mb-2">
                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={2.5} />
                </div>
              </div>
              <DialogHeader className="text-center sm:text-center">
                <DialogTitle className="text-2xl font-bold text-foreground">¡Pago Completado!</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Tu transacción ha sido confirmada en la blockchain con éxito.
                </DialogDescription>
              </DialogHeader>
              <div className="my-6 space-y-3">
                <div className="flex justify-between items-center text-sm p-3 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Contrato:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/30 bg-muted/30 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group"
                          onClick={copyContract}
                        >
                          <span className="font-mono text-[11px] text-foreground/80">
                            {formatAddress(CONTRACT_ADDRESS)}
                          </span>
                          <div className="w-px h-3 bg-border/40 mx-0.5" />
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{copied ? "Copiado" : "Copiar contrato"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex justify-between items-center text-sm p-3">
                  <span className="text-muted-foreground font-medium">Monto total:</span>
                  <span className="font-bold text-lg text-foreground">{eurtAmount.toFixed(2)} EURT</span>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  className="w-full h-12 text-base font-bold rounded-xl cursor-pointer shadow-lg shadow-primary/20"
                  onClick={handleReturnToStart}
                >
                  Volver al Inicio
                </Button>
              </DialogFooter>
            </>
          )}

          {/* D. ERROR / TIMEOUT (Simplified unified) */}
          {(modalStatus === 'failed' || modalStatus === 'timeout') && (
            <>
              <div className="flex justify-center mb-2">
                <div className={`h-20 w-20 rounded-full ${modalStatus === 'timeout' ? 'bg-warning/10' : 'bg-destructive/10'} flex items-center justify-center`}>
                  {modalStatus === 'timeout' ? <Clock className="h-10 w-10 text-warning" /> : <AlertCircle className="h-10 w-10 text-destructive" />}
                </div>
              </div>
              <DialogHeader className="text-center sm:text-center">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {modalStatus === 'timeout' ? 'Acreditación en espera' : 'Emisión pendiente'}
                </DialogTitle>
                <DialogDescription className="text-sm mt-3 text-muted-foreground">
                  {modalStatus === 'timeout' 
                    ? 'No pudimos confirmar la transacción en tiempo real debido a la congestión de la red.' 
                    : 'Hubo un inconveniente final en el minting. Tus fondos están seguros y serán acreditados pronto.'}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6">
                <Button className="w-full h-12 font-bold" onClick={handleReturnToStart}>Volver al Inicio</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Order Panel ──────────────────────────────────────────────────────────────

// ─── Order Panel ──────────────────────────────────────────────────────────────

function OrderPanel({
  amount,
  eurtAmount,
  isAmountValid,
  isProcessing,
  onSubmit,
}: {
  amount: number;
  eurtAmount: number;
  isAmountValid: boolean;
  isProcessing: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-lg shadow-border/10 overflow-hidden flex flex-col flex-1">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border/20">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Resumen del pedido
        </h2>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Visual token flow */}
        <div className="flex items-center gap-3">
          {/* From token */}
          <div className="flex-1 rounded-xl bg-muted/50 border border-border/30 px-3 py-2.5 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Pagas
            </p>
            <p className="text-lg font-extrabold text-foreground font-[family-name:var(--font-sans)] tabular-nums mt-0.5">
              {amount > 0 ? amount.toFixed(2) : "—"}
            </p>
            <p className="text-xs font-bold text-muted-foreground/60 mt-0.5">EUR</p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <ArrowRight className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>

          {/* To token */}
          <div className="flex-1 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5 text-center">
            <p className="text-[10px] text-primary/70 font-medium uppercase tracking-wide">
              Recibes
            </p>
            <p className="text-lg font-extrabold text-primary font-[family-name:var(--font-sans)] tabular-nums mt-0.5">
              {isAmountValid ? eurtAmount.toFixed(2) : "—"}
            </p>
            <p className="text-xs font-bold text-primary/50 mt-0.5">EURT</p>
          </div>
        </div>

        {/* Breakdown rows */}
        <div className="space-y-2 rounded-xl bg-muted/30 border border-border/20 px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tasa de cambio</span>
            <span className="font-semibold text-foreground">1 EUR = 1 EURT</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Comisión de red</span>
            <span className="font-semibold text-success">Gratis</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tiempo estimado</span>
            <span className="font-semibold text-foreground">{"< 30 seg"}</span>
          </div>
          <div className="h-px bg-border/30 my-1" />
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-foreground">Total a pagar</span>
            <span className="font-extrabold text-foreground font-[family-name:var(--font-sans)]">
              {amount > 0 ? `${amount.toFixed(2)} EUR` : "—"}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" aria-hidden="true" />

        {/* CTA */}
        <Button
          size="lg"
          className={cn(
            "w-full h-11 rounded-xl font-bold text-sm gap-2 transition-all duration-200",
            "cursor-pointer"
          )}
          disabled={!isAmountValid || isProcessing}
          aria-disabled={!isAmountValid || isProcessing}
          onClick={onSubmit}
          style={
            isAmountValid && !isProcessing
              ? {
                  boxShadow:
                    "0 8px 24px -8px color-mix(in srgb, var(--primary) 40%, transparent)",
                }
              : {}
          }
        >
          {isProcessing ? "Procesando..." : "Continuar al pago"}
          {!isProcessing && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
        </Button>

        {/* Security note */}
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          <Lock className="w-3 h-3 text-muted-foreground/40" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
            Transacción cifrada · SSL 256-bit
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Summary Panel ───────────────────────────────────────────────────

function PaymentSummaryPanel({
  amount,
  eurtAmount,
  onPay,
}: {
  amount: number;
  eurtAmount: number;
  onPay: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-lg shadow-border/10 overflow-hidden flex flex-col h-full flex-1">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/20 flex items-center">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Confirmación Final
        </h2>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Conversión</span>
            <span className="font-semibold text-foreground">1 EUR : 1 EURT</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">
              {amount > 0 ? `${amount.toFixed(2)} EUR` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tarifa de Red</span>
            <span className="font-semibold text-success">0.00 EUR</span>
          </div>
        </div>

        {/* Total destacado */}
        <div className="rounded-xl bg-muted/30 border border-border/20 px-4 py-4 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Total a pagar
          </p>
          <p className="text-3xl font-extrabold text-foreground font-[family-name:var(--font-sans)] tabular-nums">
            {amount > 0 ? `${amount.toFixed(2)} EUR` : "—"}
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground">Recibirás</span>
            <span className="text-sm font-extrabold text-primary tabular-nums">
              {amount > 0 ? `${eurtAmount.toFixed(2)} EURT` : "—"}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" aria-hidden="true" />

        {/* CTA */}
        <Button
          size="lg"
          className="w-full h-11 rounded-xl font-bold text-sm gap-2 cursor-pointer transition-all duration-200"
          onClick={onPay}
          style={{
            boxShadow: "0 8px 12px -4px color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        >
          Finalizar Pago ({amount > 0 ? `${amount.toFixed(2)} EUR` : "—"})
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>

        {/* Legal */}
        <p className="text-[10px] text-center text-muted-foreground/50 leading-relaxed px-2">
          Al confirmar el pago, aceptas nuestros{" "}
          <span className="underline cursor-pointer">Términos de Servicio</span>
          {" "}y la{" "}
          <span className="underline cursor-pointer">Política de Privacidad</span>.
        </p>

        {/* Security note */}
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          <Lock className="w-3 h-3 text-muted-foreground/40" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
            PCI DSS Compliant
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Exchange Widget ──────────────────────────────────────────────────────────

function ExchangeWidget({
  rawAmount,
  onChange,
  onBlur,
  hasError,
  isAmountValid,
  amount,
  eurtAmount,
}: {
  rawAmount: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  hasError: boolean;
  isAmountValid: boolean;
  amount: number;
  eurtAmount: number;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-lg shadow-border/10 overflow-hidden flex flex-col flex-1">

      {/* ── Zone 1: Envías ── */}
      <div className="p-5 space-y-4">
        {/* Token label row */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="amount-input"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-default"
          >
            Envías
          </label>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/30">
            <span className="text-sm font-bold text-foreground">€ EUR</span>
          </div>
        </div>

        {/* Amount input */}
        <div className="relative">
          <input
            id="amount-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={rawAmount}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder="0.00"
            aria-required="true"
            aria-invalid={hasError}
            aria-describedby={hasError ? "amount-error" : undefined}
            className={cn(
              "w-full bg-transparent text-4xl font-extrabold tracking-tighter leading-none",
              "font-[family-name:var(--font-sans)] placeholder:text-border/25",
              "focus:outline-none focus-visible:ring-0",
              "transition-colors duration-200 motion-reduce:transition-none",
              hasError ? "text-destructive" : "text-foreground"
            )}
          />
          {hasError && (
            <p
              id="amount-error"
              role="alert"
              className="flex items-center gap-1.5 text-xs text-destructive mt-2"
            >
              <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              El mínimo es {MIN_AMOUNT} EUR
            </p>
          )}
        </div>

        {/* Quick-select pills */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Montos rápidos"
        >
          {QUICK_AMOUNTS.map((q) => {
            const isSelected = amount === q;
            return (
              <button
                key={q}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(String(q))}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 motion-reduce:transition-none cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25"
                    : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                )}
              >
                {q} €
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Divider with exchange rate ── */}
      <div
        className="relative flex items-center gap-3 px-5 py-3 bg-muted/30 border-y border-border/20"
        aria-label="Tasa de cambio: 1 EUR = 1 EURT, sin comisión"
      >
        <div
          aria-hidden="true"
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
            isAmountValid
              ? "bg-primary/10 border border-primary/20"
              : "bg-muted border border-border/30"
          )}
        >
          <RefreshCw
            aria-hidden="true"
            className={cn(
              "w-3.5 h-3.5 transition-colors duration-300",
              isAmountValid ? "text-primary" : "text-muted-foreground/30"
            )}
          />
        </div>

        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground" aria-hidden="true">
            Tasa de conversión
          </p>
          <p className="text-xs text-foreground/60 font-medium" aria-hidden="true">
            1 EUR = 1 EURT
          </p>
        </div>

        {/* Zero fee badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20"
          aria-hidden="true"
        >
          <Zap className="w-3 h-3 text-success" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-success">
            0% comisión
          </span>
        </div>
      </div>

      {/* ── Zone 2: Recibes ── */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            aria-hidden="true"
          >
            Recibes
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15">
            <span className="text-sm font-bold text-primary">EURT</span>
          </div>
        </div>

        <div
          aria-live="polite"
          aria-atomic="true"
          aria-label={
            isAmountValid
              ? `Recibirás ${eurtAmount.toFixed(2)} EURT`
              : "Ingresa un monto para ver cuánto EURT recibirás"
          }
        >
          <p
            aria-hidden="true"
            className={cn(
              "text-4xl font-extrabold tracking-tighter leading-none tabular-nums",
              "font-[family-name:var(--font-sans)]",
              "transition-all duration-300 motion-reduce:transition-none",
              isAmountValid ? "text-primary" : "text-border/25"
            )}
          >
            {isAmountValid ? eurtAmount.toFixed(2) : "0.00"}
          </p>
        </div>

        {/* Instant credit indicator */}
        <div
          className={cn(
            "flex items-center gap-2 transition-all duration-300",
            isAmountValid ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!isAmountValid}
        >
          <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">
            Acredita en tu billetera{" "}
            <span className="text-success font-semibold">al instante</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const { address, balance, disconnectWallet, status } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayAddress = address ? formatAddress(address) : "Conectar Wallet";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50">
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 pt-3">
        <div className="flex justify-between items-center h-[60px] px-5 rounded-2xl bg-background/75 backdrop-blur-xl border border-border/40 shadow-sm shadow-border/10">
          <Link href="/compra" className="text-lg font-extrabold tracking-tight font-[family-name:var(--font-sans)]">
            <span className="text-primary">Viva</span><span className="text-[#000000]">Pay</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer",
                  isOpen ? "bg-background border-primary/30 ring-2 ring-primary/10" : "bg-muted border-border/30"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", address ? "bg-success" : "bg-muted-foreground/30")} />
                <span className="hidden sm:inline">{displayAddress}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50">
                  <div className="p-5 border-b border-border/20 bg-muted/40">
                    <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Active Wallet</span>
                      <span className="px-2 py-0.5 rounded border bg-primary/8 text-primary border-primary/20">Anvil</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground bg-primary shadow-md">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-foreground">Wallet</p>
                        <p className="text-xs font-medium text-muted-foreground font-mono mt-1.5">{balance} EURT</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button onClick={handleCopy} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">{copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}</div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-semibold">{copied ? "¡Copiado!" : "Copy Address"}</span>
                          <span className="text-xs font-mono text-muted-foreground truncate">{formatAddress(address)}</span>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => { setIsOpen(false); disconnectWallet(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 text-muted-foreground hover:text-destructive cursor-pointer">
                      <div className="p-2 rounded-lg bg-muted"><LogOut className="w-4 h-4" /></div>
                      <span className="text-sm font-semibold">Disconnect</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function PageHeader({ step, onBack }: { step: number; onBack?: () => void; }) {
  const titles: Record<number, { h1: string; sub: string }> = {
    2: { h1: "Carga tu saldo", sub: "Carga saldo en segundos y úsalo para pagar en la tienda" },
    3: { h1: "Método de Pago", sub: "Selecciona y configura tu preferencia de pago seguro." },
  };
  const { h1, sub } = titles[step] ?? titles[2];
  return (
    <header className="mb-1">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-foreground">{h1}</h1>
      <div className="flex items-center justify-between mt-1">
        <p className="text-sm text-muted-foreground">{sub}</p>
        {onBack && (
          <button onClick={onBack} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer group">
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </button>
        )}
      </div>
    </header>
  );
}
