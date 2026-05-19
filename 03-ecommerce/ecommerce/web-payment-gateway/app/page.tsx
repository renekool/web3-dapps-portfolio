"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ethers } from "ethers";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Copy,
  ExternalLink,
  Wallet,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/modern-ui/button";
import { Card, CardContent } from "@/components/modern-ui/card";
import { Badge } from "@/components/modern-ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/modern-ui/dialog";
import PaymentContainer from "@/components/PaymentContainer";
import PaymentDetailsCard from "@/components/PaymentDetailsCard";
import { usePaymentParams } from "@/lib/hooks/usePaymentParams";
import { useWallet } from "@/lib/web3/WalletContext";
import { getEcommerceContract, getEuroTokenContract } from "@/lib/web3/contracts";
import { formatEURT } from "@/lib/web3/formatters";
import PaymentConfirmed from "@/components/payment/PaymentConfirmed";

type PaymentStatus = "idle" | "fetching" | "processing" | "success" | "error";

function truncateAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => null);
}

function BrandMark() {
  return (
    <div className="header" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 0, marginBottom: "24px" }}>
      <div className="shield-wrap" style={{
        width: "60px", height: "60px", borderRadius: "20px",
        background: "var(--primary)", display: "grid", placeItems: "center",
        marginBottom: "16px", boxShadow: "0 8px 24px rgba(144,71,41,0.22)",
      }}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <h1 style={{ 
        fontFamily: "var(--font-sans)", 
        fontSize: "24px", 
        fontWeight: 800, 
        letterSpacing: "-0.04em", 
        color: "var(--foreground)", 
        marginBottom: "4px", 
        lineHeight: 1.2 
      }}>
        <span style={{ color: "var(--primary)" }}>Viva</span><span style={{ color: "#000000" }}>Pay</span>
      </h1>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: "0.01em" }}>
        Pasarela de Pago · EuroToken
      </p>
    </div>
  );
}

function InvalidScreen({ fallback, message }: { fallback: string; message?: string }) {
  return (
    <PaymentContainer>
      <Card>
        <CardContent className="py-12 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(186,26,26,0.08)" }}>
            <XCircle size={28} style={{ color: "var(--destructive)" }} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold">Enlace inválido</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
              {message || "Faltan parámetros obligatorios o los datos no coinciden con la blockchain."}
            </p>
          </div>
          <Button icon={<ArrowLeft size={15} />} onClick={() => (window.location.href = fallback)}>
            Volver a la tienda
          </Button>
        </CardContent>
      </Card>
    </PaymentContainer>
  );
}

function SuccessScreen({ amount, invoice, date, merchantAddress, txHash, returnUrl }: {
  amount: bigint; invoice: string; date: string; merchantAddress: string; txHash: string; returnUrl: string;
}) {
  return (
    <PaymentConfirmed
      amount={amount}
      invoice={invoice}
      date={date}
      merchantAddress={merchantAddress}
      txHash={txHash}
      returnUrl={returnUrl}
    />
  );
}

function ErrorScreen({ errorMsg, onRetry }: { errorMsg: string; onRetry: () => void }) {
  return (
    <PaymentContainer>
      <div className="text-center mb-7">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(186,26,26,0.08)" }}>
          <XCircle size={32} style={{ color: "var(--destructive)" }} />
        </div>
        <h1 className="text-2xl font-bold">Pago fallido</h1>
        <p className="text-sm text-muted-foreground mt-1">No se pudo completar la transacción</p>
      </div>
      <Card className="mb-6" style={{ background: "rgba(186,26,26,0.04)", border: "1px solid rgba(186,26,26,0.18)" }}>
        <CardContent className="px-6 py-5 text-center space-y-1">
          <p className="text-sm leading-relaxed">Ocurrió un problema al procesar el pago.</p>
          {errorMsg && <p className="text-xs text-muted-foreground">{errorMsg}</p>}
        </CardContent>
      </Card>
      <Button className="w-full h-11" icon={<RefreshCw size={15} />} onClick={onRetry}>Intentar nuevamente</Button>
    </PaymentContainer>
  );
}

function PaymentGatewayPage() {
  const { invoiceId, companyId, amount, merchant, redirect, isValid, isReady } = usePaymentParams();
  const { address, signer, connect, disconnect, isLoading: walletIsLoading, chainId } = useWallet();
  const isConnected = !!address;
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("fetching");
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Real on-chain validation states
  const [inconsistencyError, setInconsistencyError] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);

  const [eurBalance, setEurBalance] = useState<bigint | null>(null);

  const isLoading = walletIsLoading || paymentStatus === "processing" || paymentStatus === "fetching";

  // Fetch on-chain data — only after params are confirmed (isReady) to avoid
  // acting on stale/empty params during SSR hydration.
  useEffect(() => {
    const fetchData = async () => {
      if (!isReady) return;

      if (!isValid) {
        setPaymentStatus("idle");
        return;
      }

      setPaymentStatus("fetching");
      try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const ecommerce = getEcommerceContract(provider);
        
        // Parallel fetch for speed
        const [invoiceResult, companyResult] = await Promise.all([
          ecommerce.getInvoice(invoiceId).catch(() => null),
          ecommerce.getCompanyById(companyId).catch(() => null)
        ]);

        if (!invoiceResult || !companyResult) {
          setNotFoundError(true);
          setPaymentStatus("error");
          return;
        }

        setInvoiceData(invoiceResult);
        setCompanyData(companyResult);

        // Check if already paid
        if (invoiceResult.isPaid) {
          setIsAlreadyPaid(true);
        }

        // Validate amount and merchant address consistency
        // invoiceResult.totalAmount is bigint
        if (invoiceResult.totalAmount !== amount) {
          console.error("Amount mismatch:", invoiceResult.totalAmount, amount);
          setInconsistencyError(true);
        }
        
        if (companyResult.companyAddress.toLowerCase() !== merchant.toLowerCase()) {
          console.error("Merchant mismatch:", companyResult.companyAddress, merchant);
          setInconsistencyError(true);
        }

        setPaymentStatus("idle");
      } catch (error) {
        console.error("Error fetching on-chain data:", error);
        setNotFoundError(true);
        setPaymentStatus("error");
        setErrorMsg("Error al conectar con la red blockchain.");
      }
    };

    fetchData();
  }, [isReady, isValid, invoiceId, companyId, amount, merchant]);

  // Fetch EURT balance whenever connected address changes
  useEffect(() => {
    if (!address) return;
    const fetchBalance = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const euroToken = getEuroTokenContract(provider);
        const balance = await euroToken.balanceOf(address);
        setEurBalance(balance);
      } catch (err) {
        console.error("Failed to fetch EURT balance:", err);
        setEurBalance(0n);
      }
    };
    fetchBalance();
  }, [address]);

  const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "31337");
  const isWrongNetwork = chainId !== null && chainId !== expectedChainId;

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        // Chain not added — add Anvil
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${expectedChainId.toString(16)}`,
            chainName: "Anvil Localhost",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          }],
        });
      } else {
        toast.error("No se pudo cambiar la red.");
      }
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    const base = redirect || "http://localhost:7004";
    const separator = base.includes("?") ? "&" : "?";
    window.location.href = `${base}${separator}status=cancelled&invoice=${invoiceId}`;
  };

  const handlePay = async () => {
    if (!isConnected || !signer || paymentStatus === "processing") return;

    setPaymentStatus("processing");
    try {
      const ecommerce = getEcommerceContract(signer);
      const euroToken = getEuroTokenContract(signer);
      const ecommerceAddress = await ecommerce.getAddress();

      // 1. Check Balance
      let balance: bigint;
      try {
        balance = await euroToken.balanceOf(address!);
      } catch (balErr: any) {
        throw new Error(
          "No se puede verificar el saldo EURT. Asegúrate de estar conectado a la red Anvil (localhost:8545) en MetaMask."
        );
      }
      if (balance < amount) {
        throw new Error(`Saldo insuficiente. Tienes ${formatEURT(balance)}, necesitas ${formatEURT(amount)}.`);
      }
      setEurBalance(balance);

      // 2. Approve
      toast.info("Por favor, aprueba el gasto de EuroTokens en tu billetera...");
      const approveTx = await euroToken.approve(ecommerceAddress, amount);
      await approveTx.wait();
      toast.success("Aprobación completada.");

      // 3. Process Payment
      toast.info("Procesando pago... Firma la transacción en tu billetera.");
      const payTx = await ecommerce.processPayment(invoiceId);
      const receipt = await payTx.wait();

      // Refresh balance after payment
      const newBalance = await euroToken.balanceOf(address!);
      setEurBalance(newBalance);

      // 4. Extract txHash from PaymentProcessed event
      let eventTxHash = receipt?.hash;
      const event = receipt?.logs
        .map((log: any) => {
          try {
            return ecommerce.interface.parseLog(log);
          } catch (e: any) {
            return null;
          }
        })
        .find((e: any) => e?.name === "PaymentProcessed");

      if (event && event.args.txHash) {
        // Some contracts might store a different hash or ID, but here we use what's emitted
        // If the contract emits the real txHash as bytes32, we use it.
        eventTxHash = event.args.txHash;
      }

      setTxHash(eventTxHash || receipt?.hash || "");
      setPaymentStatus("success");
      toast.success("¡Pago procesado correctamente!");
    } catch (err: any) {
      console.error("Payment error:", err);
      let msg = "Error desconocido";
      if (err.code === "ACTION_REJECTED") msg = "Transacción rechazada por el usuario.";
      else if (err.reason) msg = err.reason;
      else if (err.message) msg = err.message;
      
      setErrorMsg(msg);
      setPaymentStatus("error");
      toast.error("No se pudo procesar el pago");
    }
  };

  // Only show InvalidScreen once mounted — during SSR/hydration, params may be
  // temporarily absent even if the URL is correct.
  if (isReady && !isValid) return <InvalidScreen fallback={redirect || "http://localhost:7004"} message="Los parámetros de la URL son inválidos." />;
  
  if (notFoundError) return <InvalidScreen fallback={redirect || "http://localhost:7004"} message="No se encontró la factura o la empresa en la blockchain." />;
  
  if (inconsistencyError) return <InvalidScreen fallback={redirect || "http://localhost:7004"} message="Los datos de la factura no coinciden con los registros on-chain." />;

  if (isAlreadyPaid && paymentStatus !== "success") {
    return (
      <PaymentContainer>
        <Card>
          <CardContent className="py-12 text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(70,103,57,0.08)" }}>
              <CheckCircle2 size={28} style={{ color: "var(--success)" }} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold">Factura pagada</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                Esta factura ya ha sido procesada anteriormente.
              </p>
            </div>
            <Button icon={<ArrowLeft size={15} />} onClick={() => (window.location.href = redirect || "http://localhost:7004")}>
              Volver a la tienda
            </Button>
          </CardContent>
        </Card>
      </PaymentContainer>
    );
  }

  if (paymentStatus === "success" && txHash) {
    return <SuccessScreen 
      amount={amount} 
      invoice={invoiceId.toString()} 
      date={invoiceData?.createdAt ? new Date(Number(invoiceData.createdAt) * 1000).toLocaleDateString() : new Date().toLocaleDateString()} 
      merchantAddress={merchant} 
      txHash={txHash} 
      returnUrl={redirect || "http://localhost:7004"} 
    />;
  }

  if (paymentStatus === "error" && !notFoundError && !inconsistencyError) {
    return <ErrorScreen errorMsg={errorMsg} onRetry={() => { setPaymentStatus("idle"); setErrorMsg(""); }} />;
  }

  const btnBase = {
    width: "100%", height: "52px", borderRadius: "12px",
    fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700,
    letterSpacing: "-0.1px", border: "none" as const,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "9px", cursor: "pointer", position: "relative" as const,
    transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
  };

  return (
    <PaymentContainer>
      <BrandMark />

      {paymentStatus === "fetching" ? (
        <Card className="mb-6">
          <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando datos de la factura...</p>
          </CardContent>
        </Card>
      ) : (
        <PaymentDetailsCard
          merchantAddress={merchant}
          walletAddress={isConnected ? address : null}
          balance={eurBalance}
          amount={amount}
          invoice={invoiceId.toString()}
          date={invoiceData?.createdAt ? new Date(Number(invoiceData.createdAt) * 1000).toLocaleDateString() : "Cargando..."}
          chainId={isConnected ? chainId : null}
          onSwitchNetwork={isConnected ? switchNetwork : undefined}
        />
      )}

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>

        {/* Connect / Disconnect wallet toggle button */}
        {isConnected ? (
          <button
            onClick={disconnect}
            style={{ 
              ...btnBase, 
              background: "#466739",
              color: "#fff", 
              boxShadow: "0 4px 14px rgba(70,103,57,0.30)",
              cursor: "pointer",
              padding: "0 18px",
              display: "flex",
              justifyContent: "center",
              gap: "10px"
            }}
            onMouseEnter={e => { (e.currentTarget).style.transform = "scale(1.015)"; (e.currentTarget).style.background = "#3d5a32"; }}
            onMouseLeave={e => { (e.currentTarget).style.transform = "none"; (e.currentTarget).style.background = "#466739"; }}
          >
            <CheckCircle2 size={18} strokeWidth={2.5} />
            <span style={{ fontWeight: 600, fontSize: "15px", letterSpacing: "0.02em" }}>
              {truncateAddress(address || "")}
            </span>

            <div 
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(address || "");
                toast.success("Dirección copiada");
              }}
              style={{
                position: "absolute",
                right: "14px",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => (e.currentTarget).style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => (e.currentTarget).style.background = "transparent"}
            >
              <Copy size={16} />
            </div>
          </button>
        ) : walletIsLoading ? (
          <button
            disabled
            style={{ ...btnBase, background: "var(--primary)", color: "#fff", boxShadow: "0 4px 14px rgba(144,71,41,0.32)", cursor: "not-allowed" }}
          >
            <span style={{ display: "inline-block", animation: "spin 0.75s linear infinite", fontSize: "18px" }}>⟳</span>
            Conectando…
          </button>
        ) : (
          <button
            onClick={connect}
            style={{ ...btnBase, background: "var(--primary)", color: "#fff", boxShadow: "0 4px 14px rgba(144,71,41,0.32)" }}
            onMouseEnter={e => { (e.currentTarget).style.background = "#7a3b21"; (e.currentTarget).style.transform = "scale(1.015)"; }}
            onMouseLeave={e => { (e.currentTarget).style.background = "var(--primary)"; (e.currentTarget).style.transform = "none"; }}
          >
            <Wallet size={17} />
            Conectar billetera
          </button>
        )}

        {/* Pay button */}
        {isConnected && paymentStatus !== "processing" ? (
          <button
            onClick={handlePay}
            disabled={paymentStatus === "fetching" || isWrongNetwork}
            style={{ ...btnBase, background: "var(--foreground)", color: "#fff", boxShadow: "0 4px 14px rgba(27,28,26,0.22)", opacity: (paymentStatus === "fetching" || isWrongNetwork) ? 0.4 : 1, cursor: isWrongNetwork ? "not-allowed" : "pointer" }}
            onMouseEnter={e => { if (paymentStatus !== "fetching" && !isWrongNetwork) { (e.currentTarget).style.background = "#2d2e2c"; (e.currentTarget).style.transform = "scale(1.015)"; } }}
            onMouseLeave={e => { if (paymentStatus !== "fetching" && !isWrongNetwork) { (e.currentTarget).style.background = "var(--foreground)"; (e.currentTarget).style.transform = "none"; } }}
          >
            <Shield size={17} />
            Pagar {formatEURT(amount)}
          </button>
        ) : paymentStatus === "processing" ? (
          <button
            disabled
            style={{ ...btnBase, background: "var(--foreground)", color: "#fff", boxShadow: "0 4px 14px rgba(27,28,26,0.22)", cursor: "not-allowed" }}
          >
            <span style={{ display: "inline-block", animation: "spin 0.75s linear infinite", fontSize: "18px" }}>⟳</span>
            Procesando…
          </button>
        ) : (
          <button
            disabled
            style={{ ...btnBase, background: "var(--accent)", color: "#b0a29d", border: "1.5px solid rgba(218,193,185,0.55)", cursor: "not-allowed", boxShadow: "none" }}
          >
            <Shield size={17} />
            Pagar {formatEURT(amount)}
          </button>
        )}

        {/* Cancel */}
        <button
          onClick={handleCancel}
          disabled={isLoading}
          style={{
            background: "transparent", border: "none", fontSize: "14px", fontWeight: 600,
            height: "40px", width: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "6px", fontFamily: "var(--font-sans)",
            transition: "color 0.15s", opacity: isLoading ? 0.4 : 1,
            cursor: isLoading ? "not-allowed" : "pointer", color: "var(--muted-foreground)",
          }}
          onMouseEnter={e => { if (!isLoading) (e.currentTarget).style.color = "var(--foreground)"; }}
          onMouseLeave={e => { if (!isLoading) (e.currentTarget).style.color = "var(--muted-foreground)"; }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Cancelar
        </button>

      </div>

      {/* Footer hint */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 400,
        color: isConnected && paymentStatus !== "processing" ? "var(--success)" : "#a8998f" }}>
        {isConnected && paymentStatus !== "processing" ? (
          <>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Billetera conectada · Lista para pagar
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#a8998f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {paymentStatus === "processing" ? "Firmando transacción…" : walletIsLoading ? "Verificando billetera…" : "Conecta tu billetera para continuar"}
          </>
        )}
      </div>

      {/* Processing Blocking Dialog */}
      <Dialog open={paymentStatus === "processing"}>
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
                Esto puede tardar unos segundos dependiendo del estado de la red.
              </DialogDescription>
            </DialogHeader>
            <p className="text-[11px] text-muted-foreground italic">No cierres esta ventana</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold text-foreground">¿Deseas cancelar?</DialogTitle>
            <DialogDescription className="text-base mt-2 px-6">
              Si cancelas ahora, perderás el progreso de tu transacción actual.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 text-center text-sm font-medium italic" style={{ color: "var(--warning)" }}>
            "Esta acción no se puede deshacer."
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
            <Button 
              className="w-full h-12 text-base font-bold rounded-2xl"
              onClick={() => setCancelDialogOpen(false)}
            >
              Seguir con el proceso
            </Button>
            <Button
              variant="ghost"
              className="w-full h-10 text-sm font-semibold"
              style={{ color: "var(--warning)" }}
              onClick={confirmCancel}
            >
              Sí, deseo cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

    </PaymentContainer>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />
      </div>
    }>
      <PaymentGatewayPage />
    </Suspense>
  );
}
