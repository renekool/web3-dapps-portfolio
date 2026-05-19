import { useState } from "react";
import { Button } from "@/components/modern-ui/button";
import PaymentContainer from "@/components/PaymentContainer";
import { ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { formatEURT } from "@/lib/web3/formatters";

interface PaymentConfirmedProps {
  amount: bigint;
  invoice: string;
  date: string;
  merchantAddress: string;
  txHash: string;
  returnUrl: string;
}

function truncateAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateHash(hash: string) {
  if (!hash || hash.length < 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-5)}`;
}

function formatDateShort(dateString: string) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

export default function PaymentConfirmed({
  amount,
  invoice,
  date,
  merchantAddress,
  txHash,
  returnUrl,
}: PaymentConfirmedProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(txHash).catch(() => null);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(merchantAddress).catch(() => null);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <PaymentContainer>
      <div className="w-full flex flex-col items-center animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-[72px] h-[72px] mb-[18px]">
            <div className="absolute inset-0 rounded-full border-2 border-success-mid animate-ring-pop" />
            <div className="absolute inset-2 rounded-full bg-success flex items-center justify-center shadow-[0_4px_16px_rgba(70,103,57,0.30)] animate-circle-pop">
              <svg 
                viewBox="0 0 24 24" 
                className="w-[26px] h-[26px] stroke-white fill-none stroke-[2.5px] stroke-linecap-round stroke-linejoin-round animate-draw-check stroke-dasharray-[30] stroke-dashoffset-[30]"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h1 className="font-sans text-2xl font-extrabold tracking-tight text-foreground mb-1">
            Pago confirmado
          </h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            La transacción se procesó correctamente
          </p>
        </div>

        {/* Main card */}
        <div className="w-full bg-card border border-border-soft rounded-[20px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_20px_rgba(70,103,57,0.06)] overflow-hidden mb-3">
          {/* Amount */}
          <div className="p-[22px_20px_18px] border-b border-border-soft text-center">
            <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1.5">
              Total pagado
            </div>
            <div className="font-sans text-4xl font-extrabold tracking-[-1.5px] leading-none" style={{ color: "var(--primary)" }}>
              {formatEURT(amount)}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-3 p-[18px_20px_20px] gap-0">
            <div className="pr-3 border-r border-border-soft mr-3">
              <div className="text-[10px] font-semibold tracking-[0.10em] uppercase text-muted-foreground mb-1.5">Factura</div>
              <div className="text-[13px] font-semibold text-foreground leading-tight">{invoice}</div>
            </div>
            <div className="pr-3 border-r border-border-soft mr-3">
              <div className="text-[10px] font-semibold tracking-[0.10em] uppercase text-muted-foreground mb-1.5">Fecha</div>
              <div className="text-[13px] font-semibold text-foreground leading-tight">{formatDateShort(date)}</div>
            </div>
            <div className="pr-3">
              <div className="text-[10px] font-semibold tracking-[0.10em] uppercase text-muted-foreground mb-1.5">Destinatario</div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[12px] font-medium text-foreground leading-tight">{truncateAddress(merchantAddress)}</span>
                <button 
                  onClick={handleCopyAddress}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                  title="Copiar dirección"
                >
                  {copiedAddress ? <CheckCircle2 size={13} className="text-success" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hash card */}
        <div className="w-full bg-card border border-border-soft rounded-[14px] p-[14px_16px] mb-4 flex flex-col gap-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Hash de transacción
          </span>
          <div className="flex items-center justify-between bg-background rounded-lg p-[9px_12px] border border-border-soft">
            <span className="font-mono text-[12px] text-foreground leading-tight">
              {truncateHash(txHash)}
            </span>
            <button 
              onClick={handleCopyHash}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer flex items-center justify-center"
              title="Copiar hash"
            >
              {copiedHash ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col gap-2.5">
          <Button
            className="w-full h-[52px] rounded-xl font-sans text-[15px] font-bold tracking-[-0.1px] shadow-[0_4px_14px_rgba(144,71,41,0.30)] hover:scale-[1.015] hover:shadow-[0_6px_20px_rgba(144,71,41,0.38)] active:scale-[0.99] transition-all duration-180"
            icon={<ExternalLink size={17} />}
            onClick={() => {
              const separator = returnUrl.includes("?") ? "&" : "?";
              window.location.href = `${returnUrl}${separator}status=success&invoice=${invoice}`;
            }}
          >
            Volver a la tienda
          </Button>
          <Button
            variant="outline"
            className="w-full h-[52px] rounded-xl font-sans text-[15px] font-bold tracking-[-0.1px] border-[1.5px] border-border hover:bg-accent hover:border-[#c4a89e] hover:scale-[1.015] active:scale-[0.99] transition-all duration-180"
            onClick={() => {
              const path = returnUrl.endsWith("/") ? returnUrl.slice(0, -1) : returnUrl;
              window.location.href = `${path}/orders?status=success&invoice=${invoice}`;
            }}
          >
            Ver mis órdenes
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes ring-pop {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes circle-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes draw-check {
          100% { stroke-dashoffset: 0; }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-ring-pop {
          animation: ring-pop 0.5s ease both 0.1s;
        }
        .animate-circle-pop {
          animation: circle-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both 0.2s;
        }
        .animate-draw-check {
          animation: draw-check 0.35s ease both 0.55s;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.45s ease forwards;
        }
      `}</style>
    </PaymentContainer>
  );
}
