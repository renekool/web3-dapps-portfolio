"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  List,
  Plus,
  ShieldCheck,
  Clock,
  Lock,
  Wallet,
  ChevronDown,
  LogOut,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  Layers,
  FileText,
  X,
  Coins,
  Gem,
  Network,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/modern-ui/button";
import { Badge } from "@/components/modern-ui/badge";
import { FluidDropdown, type Category } from "@/components/modern-ui/fluid-dropdown";

import { Contract, Interface, parseUnits, formatUnits } from "ethers";

import { DS } from "@/lib/design-system";
import {
  formatAddress,
  formatAmount,
  getStateLabel,
  type MockOperation,
  type EscrowState,
  type Token,
} from "@/lib/mockData";
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";
import { parseContractError } from "@/lib/errors";
import { useEthereumContext } from "@/lib/ethereum";
import { useSession } from "@/lib/web3/SessionContext";

type TabType = "mine" | "available" | "new";

const TOKEN_ICON_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];


const STATE_COLORS: Record<EscrowState, { bg: string; fg: string }> = {
  Active: { bg: "#FEF3C7", fg: "#D97706" },
  Completed: { bg: "#DCFCE7", fg: "#16A34A" },
  Cancelled: { bg: "#FEE2E2", fg: "#DC2626" },
};

const STATE_ICON_MAP: Record<EscrowState, React.ElementType> = {
  Active: Clock,
  Completed: CheckCircle,
  Cancelled: XCircle,
};

function StateIcon({ state, size = 14, color }: { state: EscrowState; size?: number; color: string }) {
  const Icon = STATE_ICON_MAP[state];
  return <Icon size={size} strokeWidth={2.2} style={{ color, flexShrink: 0 }} aria-hidden="true" />;
}

// ============================================================
// OPERATION CARD (my-ops and available styles match HTML exactly)
// ============================================================

function OperationCard({ op, isExecutable, isAvailable, onCancel, onExecute, onValidate }: { op: MockOperation; isExecutable?: boolean; isAvailable?: boolean; onCancel?: (id: number) => void; onExecute?: (id: number) => void; onValidate?: (id: number) => Promise<boolean> }) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [copied, setCopied] = useState("");
  const colors = STATE_COLORS[op.state];
  const opNum = (op.id + 1).toString();

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    toast.success("Dirección copiada");
    setTimeout(() => setCopied(""), 1200);
  };

  if (isAvailable) {
    // AVAILABLE CARD (smaller, compact grid)
    return (
      <>
        <article
          style={{
            background: DS.colors.surface,
            border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.lg,
            padding: "18px",
            boxShadow: DS.shadow.card,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            transition: `all 200ms`,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = DS.shadow.cardH;
            (e.currentTarget as HTMLElement).style.borderColor = DS.colors.brand;
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = DS.shadow.card;
            (e.currentTarget as HTMLElement).style.borderColor = DS.colors.border;
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          {/* Top: ID + Status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textMuted }}>
                Operación: <span style={{ fontFamily: "var(--font-mono)", color: DS.colors.textPrimary }}>#{opNum}</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <StateIcon state={op.state} size={14} color={colors.fg} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: colors.fg }}>
                {getStateLabel(op.state)}
              </span>
            </div>
          </div>

          {/* Swap (participant view for available) */}
          <div
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: "16px",
              backgroundColor: DS.colors.surfaceIn,
              borderRadius: DS.radius.md,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.textMuted }}>
                Entregas
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.6px", color: DS.colors.textPrimary, lineHeight: 1 }}>
                  {formatAmount(op.amountB, op.tokenB.decimals)}
                </span>
                <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.brand, backgroundColor: DS.colors.brandSoft, padding: "2px 6px", borderRadius: "4px" }}>
                  {op.tokenB.symbol}
                </span>
              </div>
            </div>

            <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: DS.colors.surface, border: `1px solid ${DS.colors.border}`, display: "grid", placeItems: "center", color: DS.colors.brand, flexShrink: 0 }}>
              <ArrowRight size={14} strokeWidth={2.2} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.textMuted }}>
                Recibes
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.6px", color: DS.colors.textPrimary, lineHeight: 1 }}>
                  {formatAmount(op.amountA, op.tokenA.decimals)}
                </span>
                <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.okFg, backgroundColor: DS.colors.okBg, padding: "2px 6px", borderRadius: "4px" }}>
                  {op.tokenA.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: Creator + Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: `1px solid ${DS.colors.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: DS.colors.textSecondary }}>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: DS.colors.textMuted }}>Creador</div>
                <div style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 600, color: DS.colors.textPrimary, display: "flex", alignItems: "center", gap: "4px" }}>
                  {formatAddress(op.creator)}
                  <button
                    type="button"
                    onClick={() => handleCopy(op.creator)}
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: "none",
                      background: "transparent",
                      color: DS.colors.textMuted,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: `all 150ms`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surface;
                      (e.currentTarget as HTMLElement).style.color = DS.colors.brand;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = DS.colors.textMuted;
                    }}
                  >
                    {copied === op.creator ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (onValidate) {
                  const ok = await onValidate(op.id);
                  if (!ok) return;
                }
                setOpenConfirm(true);
              }}
              style={{
                fontSize: "13px",
                fontWeight: 700,
                padding: "10px 22px",
                backgroundColor: DS.colors.brand,
                color: "white",
                border: "none",
                borderRadius: DS.radius.md,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: `all 200ms`,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.brandHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.brand;
              }}
            >
              Ejecutar
              <ArrowRight size={13} strokeWidth={2.2} />
            </button>
          </div>
        </article>

        {/* Modal */}
        {openConfirm && (
          <ConfirmModal op={op} isAvailable={isAvailable} onClose={() => setOpenConfirm(false)} onExecute={() => onExecute?.(op.id)} />
        )}
      </>
    );
  }

  // MY OPERATIONS CARD (full-size)
  return (
    <>
      <article
        style={{
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.lg,
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: DS.shadow.card,
          transition: `all 200ms`,
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = DS.shadow.cardH;
          (e.currentTarget as HTMLElement).style.borderColor = DS.colors.brand;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = DS.shadow.card;
          (e.currentTarget as HTMLElement).style.borderColor = DS.colors.border;
        }}
      >
        {/* Top: ID + Status */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textMuted }}>
              Operación: <span style={{ fontFamily: "var(--font-mono)", color: DS.colors.textPrimary }}>#{opNum}</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <StateIcon state={op.state} size={14} color={colors.fg} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: colors.fg }}>
              {getStateLabel(op.state)}
            </span>
          </div>
        </div>

        {/* Swap (my view) */}
        <div
          style={{
            width: "100%",
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "12px",
            backgroundColor: DS.colors.surfaceIn,
            borderRadius: DS.radius.md,
            opacity: op.state === "Cancelled" ? 0.55 : 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start", justifySelf: "center", minWidth: 0 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.textMuted }}>
              {op.state === "Active" ? "Ofreces" : "Entregaste"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary, lineHeight: 1.15 }}>
                {formatAmount(op.amountA, op.tokenA.decimals)}
              </span>
              <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.brand, backgroundColor: DS.colors.brandSoft, padding: "3px 8px", borderRadius: "4px" }}>
                {op.tokenA.symbol}
              </span>
            </div>
          </div>

          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: DS.colors.surface, border: `1px solid ${DS.colors.border}`, display: "grid", placeItems: "center", color: DS.colors.brand, flexShrink: 0 }}>
            <ArrowRight size={14} strokeWidth={2.2} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start", justifySelf: "center", minWidth: 0 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.textMuted }}>
              {op.state === "Active" ? "Solicitas" : "Recibiste"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary, lineHeight: 1.15 }}>
                {formatAmount(op.amountB, op.tokenB.decimals)}
              </span>
              <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.okFg, backgroundColor: DS.colors.okBg, padding: "3px 8px", borderRadius: "4px" }}>
                {op.tokenB.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Meta row: Creator & Executor */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", paddingTop: "2px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", minWidth: 0 }}>
            <span style={{ color: DS.colors.textMuted, fontSize: "12px", fontWeight: 500, flexShrink: 0, paddingLeft: "4px" }}>Creador</span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: DS.colors.surfaceIn,
                border: `1px solid ${DS.colors.border}`,
                borderRadius: "9999px",
                padding: "3px 4px 3px 10px",
                fontSize: "11.5px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: DS.colors.textPrimary,
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: DS.colors.brand, marginRight: "4px", flexShrink: 0 }} />
              {formatAddress(op.creator)}
              <button
                type="button"
                onClick={() => handleCopy(op.creator)}
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: DS.colors.textMuted,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  transition: `all 150ms`,
                  marginLeft: "2px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surface;
                  (e.currentTarget as HTMLElement).style.color = DS.colors.brand;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = DS.colors.textMuted;
                }}
              >
                {copied === op.creator ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", minWidth: 0 }}>
            <span style={{ color: DS.colors.textMuted, fontSize: "12px", fontWeight: 500, flexShrink: 0, paddingLeft: "4px" }}>Ejecutor</span>
            {op.executor ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: DS.colors.surfaceIn,
                  border: `1px solid ${DS.colors.border}`,
                  borderRadius: "9999px",
                  padding: "3px 4px 3px 10px",
                  fontSize: "11.5px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: DS.colors.textPrimary,
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: DS.colors.brand, marginRight: "4px", flexShrink: 0 }} />
                {formatAddress(op.executor)}
                <button
                  type="button"
                  onClick={() => handleCopy(op.executor!)}
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    color: DS.colors.textMuted,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    transition: `all 150ms`,
                    marginLeft: "2px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surface;
                    (e.currentTarget as HTMLElement).style.color = DS.colors.brand;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = DS.colors.textMuted;
                  }}
                >
                  {copied === op.executor ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "transparent",
                  border: `1px dashed ${DS.colors.textMuted}`,
                  borderRadius: "9999px",
                  padding: "3px 8px 3px 6px",
                  fontSize: "11.5px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                  fontStyle: "italic",
                  color: DS.colors.textMuted,
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: DS.escrow.active.dot, flexShrink: 0 }} />
                pendiente
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Status note + Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingTop: "16px", borderTop: `1px solid ${DS.colors.border}` }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textMuted, display: "flex", alignItems: "center", gap: "8px" }}>
            {op.state === "Active" ? "Esperando ejecutor" : op.state === "Completed" ? "Liquidada on-chain" : "Cancelada por ti"}
          </span>

          {op.state === "Active" && !isExecutable && (
            <button
              type="button"
              onClick={() => { onCancel?.(op.id); toast.success("Operación cancelada"); }}
              style={{
                fontSize: "13px",
                fontWeight: 700,
                padding: "10px 22px",
                backgroundColor: DS.colors.errBg,
                color: DS.colors.errFg,
                border: "none",
                borderRadius: DS.radius.md,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: `all 200ms`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.filter = "brightness(0.97)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.filter = "brightness(1)";
              }}
            >
              <X size={13} strokeWidth={2.6} />
              Cancelar
            </button>
          )}
          {(op.state === "Completed" || op.state === "Cancelled") && (
            <button
              type="button"
              onClick={() => setOpenDetails(true)}
              style={{
                fontSize: "13px",
                fontWeight: 700,
                padding: "10px 22px",
                backgroundColor: DS.colors.surface,
                color: DS.colors.textSecondary,
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: `all 200ms`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surfaceIn;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surface;
              }}
            >
              <FileText size={13} strokeWidth={2} />
              Ver detalles
            </button>
          )}
        </div>
      </article>

      {/* Modal */}
      {openConfirm && isExecutable && (
        <ConfirmModal op={op} isAvailable={isAvailable} onClose={() => setOpenConfirm(false)} onExecute={() => onExecute?.(op.id)} />
      )}
      {openDetails && (
        <DetailsModal op={op} onClose={() => setOpenDetails(false)} />
      )}
    </>
  );
}

// ============================================================
// CONFIRM MODAL
// ============================================================

function ConfirmModal({ op, isAvailable, onClose, onExecute }: { op: MockOperation; isAvailable?: boolean; onClose: () => void; onExecute?: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);

  const steps = [
    { num: 1, title: "Aprobación", desc: "Autoriza al contrato a mover tus tokens", time: "~5 s" },
    { num: 2, title: "Firmando", desc: "Firma desde tu wallet", time: "~3 s" },
    { num: 3, title: "Minando", desc: "Esperando confirmación del bloque", time: "~12 s" },
    { num: 4, title: "Confirmado", desc: "Tokens transferidos a ambas wallets", time: "—" },
  ];

  const renderStepDot = (i: number) => {
    if (i < stepIdx) {
      return <Check size={14} strokeWidth={2.6} />;
    }
    return (i + 1).toString();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay-bg)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
        animation: "fadeIn 0.2s",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 92vw)",
          padding: "28px",
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.lg,
          boxShadow: "0 4px 20px rgba(0,0,0,.12)",
        }}
      >
        {/* Header */}
        <div>
          <h2 id="confirm-modal-title" style={{ fontSize: "16px", fontWeight: 800, color: DS.colors.textPrimary }}>
            Ejecutar Operación
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: DS.colors.textMuted, marginTop: "2px" }}>
            #{op.id + 1}
          </p>
          <p style={{ fontSize: "13px", color: DS.colors.textSecondary, marginTop: "4px" }}>
            Swap atómico on-chain. Una vez firmada, la transacción no puede revertirse.
          </p>
        </div>

        {/* TX Summary */}
        <div
          style={{
            backgroundColor: DS.colors.surfaceIn,
            borderRadius: DS.radius.md,
            padding: "14px 16px",
            margin: "16px 0 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: DS.colors.textMuted, marginBottom: "4px" }}>
              Entregas
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px", color: DS.colors.textPrimary }}>
              {/* isAvailable: executor entrega tokenB (creator's request). owner: creator entrega tokenA (locked) */}
              {formatAmount(isAvailable ? op.amountB : op.amountA, isAvailable ? op.tokenB.decimals : op.tokenA.decimals)}{" "}
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.brand, backgroundColor: DS.colors.brandSoft, padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>
                {isAvailable ? op.tokenB.symbol : op.tokenA.symbol}
              </span>
            </div>
          </div>

          <ArrowRight size={18} strokeWidth={2} style={{ color: DS.colors.textMuted }} />

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: DS.colors.textMuted, marginBottom: "4px" }}>
              Recibes
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px", color: DS.colors.textPrimary }}>
              {/* isAvailable: executor recibe tokenA (locked in escrow). owner: creator recibe tokenB */}
              {formatAmount(isAvailable ? op.amountA : op.amountB, isAvailable ? op.tokenA.decimals : op.tokenB.decimals)}{" "}
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.okFg, backgroundColor: DS.colors.okBg, padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>
                {isAvailable ? op.tokenA.symbol : op.tokenB.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "16px 0" }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "10px 0",
                borderTop: i > 0 ? `1px dashed ${DS.colors.border}` : "none",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: i < stepIdx ? DS.colors.okFg : DS.colors.surfaceIn,
                  border: i < stepIdx ? `2px solid ${DS.colors.okFg}` : `2px solid ${DS.colors.border}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: i < stepIdx ? "white" : DS.colors.textMuted,
                  flexShrink: 0,
                  ...(i === stepIdx && { boxShadow: `0 0 0 5px ${DS.colors.brandSoft}` }),
                }}
              >
                {renderStepDot(i)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: i < stepIdx ? DS.colors.textPrimary : DS.colors.textSecondary,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: "11.5px",
                    color: i < stepIdx ? DS.colors.okFg : DS.colors.textMuted,
                    marginTop: "1px",
                  }}
                >
                  {step.desc}
                </div>
              </div>

              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: DS.colors.textMuted }}>
                {step.time}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", marginTop: "28px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              padding: "10px 22px",
              backgroundColor: DS.colors.surface,
              color: DS.colors.textSecondary,
              border: `1px solid ${DS.colors.border}`,
              borderRadius: DS.radius.md,
              cursor: "pointer",
              transition: `all 200ms`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surfaceIn;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surface;
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => {
              if (stepIdx < 4) {
                setStepIdx(stepIdx + 1);
              } else {
                onExecute?.();
                onClose();
              }
            }}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              padding: "10px 22px",
              backgroundColor: DS.colors.brand,
              color: "white",
              border: "none",
              borderRadius: DS.radius.md,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: `all 200ms`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.brandHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.brand;
            }}
          >
            {stepIdx >= 4 ? (
              <>
                <Check size={14} strokeWidth={2.6} /> Hecho
              </>
            ) : (
              <>Continuar <ArrowRight size={14} strokeWidth={2.2} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DETAILS MODAL
// ============================================================

function DetailsModal({ op, onClose }: { op: MockOperation; onClose: () => void }) {
  const colors = STATE_COLORS[op.state];
  const opNum = (op.id + 1).toString();

  const fmt = (ts: number) =>
    new Date(ts).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  type TimelineItem = {
    label: string;
    ts: number;
    Icon: React.ElementType;
    done: boolean;
    ok?: boolean;
    warn?: boolean;
  };

  const timelineItems: TimelineItem[] = [
    { label: "Creada", ts: op.createdAt, Icon: Plus, done: true },
    ...(op.closedAt
      ? [
          {
            label: op.state === "Completed" ? "Liquidada" : "Cancelada",
            ts: op.closedAt,
            Icon: op.state === "Completed" ? CheckCircle : XCircle,
            done: true,
            ok: op.state === "Completed",
          },
        ]
      : []),
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay-bg)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
        animation: "fadeIn 0.2s",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 92vw)",
          padding: "28px",
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.lg,
          boxShadow: "0 4px 20px rgba(0,0,0,.12)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 id="details-modal-title" style={{ fontSize: "16px", fontWeight: 800, color: DS.colors.textPrimary }}>
              Operación
            </h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: DS.colors.textMuted, marginTop: "2px" }}>
              #{opNum}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <StateIcon state={op.state} size={14} color={colors.fg} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: colors.fg }}>
              {getStateLabel(op.state)}
            </span>
          </div>
        </div>

        {/* Swap summary */}
        <div
          style={{
            padding: "14px 18px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "12px",
            backgroundColor: DS.colors.surfaceIn,
            borderRadius: DS.radius.md,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.textMuted }}>
              Ofrecido
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary, lineHeight: 1 }}>
                {formatAmount(op.amountA, op.tokenA.decimals)}
              </span>
              <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.brand, backgroundColor: DS.colors.brandSoft, padding: "2px 6px", borderRadius: "4px" }}>
                {op.tokenA.symbol}
              </span>
            </div>
          </div>

          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: DS.colors.surface, border: `1px solid ${DS.colors.border}`, display: "grid", placeItems: "center", color: DS.colors.brand, flexShrink: 0 }}>
            <ArrowRight size={13} strokeWidth={2.2} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.textMuted }}>
              Solicitado
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary, lineHeight: 1 }}>
                {formatAmount(op.amountB, op.tokenB.decimals)}
              </span>
              <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.okFg, backgroundColor: DS.colors.okBg, padding: "2px 6px", borderRadius: "4px" }}>
                {op.tokenB.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.textMuted, marginBottom: "14px" }}>
            Línea de tiempo
          </div>
          {timelineItems.map((item, i) => {
            const dotColor = item.ok ? DS.colors.okFg : item.warn ? DS.colors.errFg : item.done ? DS.colors.brand : DS.colors.textMuted;
            return (
              <div key={i} style={{ display: "flex", gap: "14px", position: "relative" }}>
                {i < timelineItems.length - 1 && (
                  <div style={{ position: "absolute", left: "14px", top: "30px", bottom: 0, width: "1px", backgroundColor: DS.colors.border }} />
                )}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: item.done ? `${dotColor}18` : DS.colors.surfaceIn,
                    border: `1.5px solid ${item.done ? dotColor : DS.colors.border}`,
                    display: "grid",
                    placeItems: "center",
                    color: dotColor,
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <item.Icon size={12} strokeWidth={2.2} />
                </div>
                <div style={{ paddingBottom: i < timelineItems.length - 1 ? "16px" : 0, flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.textPrimary }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "11px", color: DS.colors.textMuted, marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                    {fmt(item.ts)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Addresses */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            paddingTop: "4px",
            borderTop: `1px solid ${DS.colors.border}`,
          }}
        >
          {[
            { label: "Creador", addr: op.creator },
            { label: "Ejecutor", addr: op.executor ?? null },
          ].map(({ label, addr }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.textMuted }}>
                {label}
              </span>
              {addr ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    backgroundColor: DS.colors.surfaceIn,
                    border: `1px solid ${DS.colors.border}`,
                    borderRadius: "9999px",
                    padding: "3px 4px 3px 10px",
                    width: "fit-content",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: DS.colors.brand, flexShrink: 0 }} />
                  <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 600, color: DS.colors.textPrimary }}>
                    {formatAddress(addr)}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(addr);
                      toast.success("Dirección copiada");
                    }}
                    title={addr}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      border: "none",
                      background: "transparent",
                      color: DS.colors.textMuted,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      transition: "all 150ms",
                      marginLeft: "2px",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surface;
                      (e.currentTarget as HTMLElement).style.color = DS.colors.brand;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = DS.colors.textMuted;
                    }}
                  >
                    <Copy size={11} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    border: `1px dashed ${DS.colors.textMuted}`,
                    borderRadius: "9999px",
                    padding: "3px 10px 3px 8px",
                    width: "fit-content",
                    fontSize: "11.5px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                    fontStyle: "italic",
                    color: DS.colors.textMuted,
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: DS.escrow.active.dot, flexShrink: 0 }} />
                  pendiente
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Close */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              padding: "10px 22px",
              backgroundColor: DS.colors.surface,
              color: DS.colors.textSecondary,
              border: `1px solid ${DS.colors.border}`,
              borderRadius: DS.radius.md,
              cursor: "pointer",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surfaceIn;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surface;
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ label, value, accent, icon: Icon, color, unit }: { label: string; value: string | number; accent?: boolean; icon: any; color?: string; unit?: string }) {
  const isAccent = accent || false;

  return (
    <div
      style={{
        background: isAccent ? DS.colors.brand : DS.colors.surface,
        border: isAccent ? "transparent" : `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.lg,
        padding: "18px 20px",
        boxShadow: isAccent ? "0 8px 24px rgba(91,82,229,.32)" : DS.shadow.card,
      }}
    >
      <div
        style={{
          fontSize: "10.5px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: color || (isAccent ? "rgba(255,255,255,.78)" : DS.colors.textMuted),
        }}
      >
        <span style={{ width: "14px", height: "14px", opacity: 0.85, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} strokeWidth={2} />
        </span>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <p
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.8px",
            lineHeight: 1,
            color: isAccent ? "white" : DS.colors.textPrimary,
          }}
        >
          {value}
        </p>
        {unit && (
          <small style={{ fontSize: "13px", fontWeight: 600, letterSpacing: 0, marginLeft: "4px", color: isAccent ? "rgba(255,255,255,.7)" : (color || DS.colors.textMuted) }}>
            {unit}
          </small>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CREATE OPERATION FORM
// ============================================================

function CreateOperationForm({ onCreateOp, creatorAddress, signer: signerProp, tokenRegistry, tokenCategories, walletBalances }: {
  onCreateOp: () => void;
  creatorAddress: string;
  signer: import("ethers").JsonRpcSigner | null;
  tokenRegistry: Record<string, Token>;
  tokenCategories: import("@/components/modern-ui/fluid-dropdown").Category[];
  walletBalances: Record<string, string>;
}) {
  const [amountA, setAmountA] = useState("");
  const [tokA, setTokA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [tokB, setTokB] = useState("");
  const [hasErrorA, setHasErrorA] = useState(false);
  const [hasErrorB, setHasErrorB] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("");

  // Initialize tokA/tokB from real registry on first load
  useEffect(() => {
    const syms = Object.values(tokenRegistry).map((t) => t.symbol);
    if (syms.length >= 1 && !tokA) setTokA(syms[0]);
    if (syms.length >= 2 && !tokB) setTokB(syms[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenRegistry]);

  const symA = tokA;
  const symB = tokB;

  const getToken = (sym: string): Token => {
    return Object.values(tokenRegistry).find((t) => t.symbol === sym)
      ?? { symbol: sym, address: "0x0000000000000000000000000000000000000000", decimals: 18 };
  };

  const rate = amountA && parseFloat(amountA) > 0 && amountB && parseFloat(amountB) > 0
    ? (parseFloat(amountB) / parseFloat(amountA)).toFixed(4)
    : "—";

  const parseFormattedBalance = (s: string): number => {
    const clean = s.replace(/,/g, "").trim();
    if (clean.endsWith("M")) return parseFloat(clean) * 1_000_000;
    if (clean.endsWith("K")) return parseFloat(clean) * 1_000;
    return parseFloat(clean) || 0;
  };
  const availableA = parseFormattedBalance(walletBalances[symA] ?? "0");
  const parsedA = parseFloat(amountA) || 0;
  const parsedB = parseFloat(amountB) || 0;
  const insufficientBalance = parsedA > 0 && parsedA > availableA;
  const canSubmit = parsedA > 0 && parsedB > 0 && !insufficientBalance && !isSubmitting;

  const fmtPreview = (val: string, tokenKey: string) => {
    const tok = getToken(tokenKey);
    if (!tok || !val || parseFloat(val) <= 0) return "0.00";
    try {
      return formatAmount(parseUnits(val, tok.decimals), tok.decimals);
    } catch {
      return "0.00";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let ok = true;
    if (!parseFloat(amountA)) { setHasErrorA(true); ok = false; } else { setHasErrorA(false); }
    if (!parseFloat(amountB)) { setHasErrorB(true); ok = false; } else { setHasErrorB(false); }
    if (!ok || !signerProp) return;

    const tokenA = getToken(tokA);
    const tokenB = getToken(tokB);

    if (tokenA.address === tokenB.address) {
      toast.error("No puedes intercambiar un token por sí mismo");
      return;
    }

    // Validar saldo suficiente antes de enviar TX
    const availableA = parseFormattedBalance(walletBalances[symA] ?? "0");
    if (parseFloat(amountA) > availableA) {
      setHasErrorA(true);
      toast.error(`Saldo insuficiente — tienes ${walletBalances[symA] ?? "0"} ${symA}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: approve tokenA — I14: reset a 0 solo si ya hay allowance previa
      setSubmitLabel("Paso 1/2 — Aprobando…");
      const erc20A = new Contract(tokenA.address, ERC20_ABI, signerProp);
      const decimalsA = await erc20A.decimals();
      const rawAmountA = parseUnits(amountA, decimalsA);
      const userAddress = await signerProp.getAddress();
      const currentAllowanceA: bigint = await erc20A.allowance(userAddress, ESCROW_ADDRESS);
      if (currentAllowanceA > BigInt(0)) {
        const resetTx = await erc20A.approve(ESCROW_ADDRESS, 0);
        await resetTx.wait();
      }
      const approveTx = await erc20A.approve(ESCROW_ADDRESS, rawAmountA);
      await approveTx.wait();

      // Step 2: createOperation
      setSubmitLabel("Paso 2/2 — Creando operación…");
      const erc20B = new Contract(tokenB.address, ERC20_ABI, signerProp);
      const decimalsB = await erc20B.decimals();
      const rawAmountB = parseUnits(amountB, decimalsB);
      const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 días
      const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signerProp);
      const tx = await escrow.createOperation(tokenA.address, tokenB.address, rawAmountA, rawAmountB, deadline);
      await tx.wait();

      toast.success("Operación creada — esperando executor");
      setIsSubmitting(false);
      setSubmitLabel("");
      setAmountA("");
      setAmountB("");
      onCreateOp();
    } catch (err) {
      const msg = parseContractError(err);
      if (msg) toast.error(msg);
      setIsSubmitting(false);
      setSubmitLabel("");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "24px", alignItems: "stretch" }}>
      {/* FORM */}
      <div
        style={{
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.lg,
          boxShadow: DS.shadow.card,
          display: "flex",
          flexDirection: "column",
          overflow: "visible"
        }}
      >
        <div style={{ padding: "28px 28px 0 28px", flex: 1 }}>
          <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary }}>
            Nueva operación
          </h3>
          <p style={{ fontSize: "13px", color: DS.colors.textSecondary, marginTop: "6px", maxWidth: "480px", lineHeight: 1.5 }}>
            Define qué tokens vas a depositar en escrow y qué esperas recibir a cambio. La operación queda Activa hasta que otro usuario la ejecute o tú la canceles.
          </p>
        </div>

        <form id="create-op-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Unified Block */}
          <div
            style={{
              background: DS.colors.surfaceIn,
              border: `1px solid ${DS.colors.border}`,
              borderRadius: DS.radius.lg,
              position: "relative",
              overflow: "visible",
            }}
          >
            {/* ENTREGAS ROW */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr 200px",
                gap: "20px",
                padding: "28px",
                transition: "all 200ms",
                ...(hasErrorA && { background: `${DS.colors.errFg}08`, outline: `1.5px solid ${DS.colors.errFg}`, outlineOffset: "-1px", borderRadius: `${DS.radius.lg} ${DS.radius.lg} 0 0` }),
              }}
            >
              {/* Left: Icon */}
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: `${DS.colors.brand}15`,
                  color: DS.colors.brand,
                  display: "grid",
                  placeItems: "center",
                  marginTop: "4px",
                }}
              >
                <ArrowUp size={20} strokeWidth={2.5} />
              </div>

              {/* Center: Input & Label */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.brand, marginBottom: "8px" }}>
                  ENTREGAS (ESCROW)
                </span>
                <div style={{ display: "inline-flex", alignItems: "baseline", gap: "6px" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    aria-label="Monto a entregar en escrow"
                    value={amountA}
                    onChange={(e) => {
                      setAmountA(e.target.value);
                      if (parseFloat(e.target.value) > 0) setHasErrorA(false);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      fontSize: amountA.length > 8 ? "20px" : "32px",
                      fontWeight: 800,
                      color: DS.colors.textPrimary,
                      letterSpacing: "-1px",
                      width: `${Math.max(1, amountA.length || 1)}ch`,
                      minWidth: "1.5ch",
                    }}
                  />
                  <span style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textMuted }}>{symA}</span>
                </div>
                <div style={{ marginTop: "8px", fontSize: "12px", color: DS.colors.textMuted }}>
                  Saldo disponible: <b style={{ color: DS.colors.textSecondary }}>{walletBalances[symA] ?? "—"} {symA}</b>
                </div>
                {insufficientBalance && (
                  <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: 600, color: DS.colors.errFg }}>
                    Saldo insuficiente — máximo {walletBalances[symA] ?? "0"} {symA}
                  </div>
                )}
                {hasErrorA && !insufficientBalance && (
                  <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: 600, color: DS.colors.errFg }}>
                    Ingresa un monto mayor a 0
                  </div>
                )}
              </div>

              {/* Right: Meta & Select */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, color: DS.colors.textMuted }}>
                  se bloquea hasta liquidar
                </span>
                <FluidDropdown
                  categories={tokenCategories}
                  selectedId={tokA}
                  onChange={(id) => {
                    if (id === tokB) {
                      setTokB(tokA);
                    }
                    setTokA(id);
                  }}
                  className="w-[190px]"
                />
              </div>
            </div>

            {/* Separator & Rate Pill */}
            <div style={{ position: "relative", height: "60px", display: "flex", alignItems: "center", margin: "0 24px" }}>
              <div style={{ width: "100%", height: "1px", background: DS.colors.border }} />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: DS.colors.surface,
                  border: `1px solid ${DS.colors.border}`,
                  borderRadius: "9999px",
                  padding: "14px 32px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: DS.colors.textSecondary,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: DS.colors.brand,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ArrowRight size={12} strokeWidth={3} />
                </div>
                <span>
                  Tasa <b style={{ color: DS.colors.textPrimary }}>1 {symA} = {rate} {symB}</b>
                </span>
              </div>
            </div>

            {/* RECIBES ROW */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr 200px",
                gap: "20px",
                padding: "28px",
                transition: "all 200ms",
                ...(hasErrorB && { background: `${DS.colors.errFg}08`, outline: `1.5px solid ${DS.colors.errFg}`, outlineOffset: "-1px", borderRadius: `0 0 ${DS.radius.lg} ${DS.radius.lg}` }),
              }}
            >
              {/* Left: Icon */}
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: `${DS.colors.okFg}15`,
                  color: DS.colors.okFg,
                  display: "grid",
                  placeItems: "center",
                  marginTop: "4px",
                }}
              >
                <ArrowDown size={20} strokeWidth={2.5} />
              </div>

              {/* Center: Input & Label */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: DS.colors.okFg, marginBottom: "8px" }}>
                  RECIBES (A CAMBIO)
                </span>
                <div style={{ display: "inline-flex", alignItems: "baseline", gap: "6px" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    aria-label="Monto a recibir a cambio"
                    value={amountB}
                    onChange={(e) => {
                      setAmountB(e.target.value);
                      if (parseFloat(e.target.value) > 0) setHasErrorB(false);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      fontSize: amountB.length > 8 ? "20px" : "32px",
                      fontWeight: 800,
                      color: DS.colors.textPrimary,
                      letterSpacing: "-1px",
                      width: `${Math.max(1, amountB.length || 1)}ch`,
                      minWidth: "1.5ch",
                    }}
                  />
                  <span style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textMuted }}>{symB}</span>
                </div>
                <div style={{ marginTop: "8px", fontSize: "12px", color: DS.colors.textMuted }}>
                  Token recibido en tu wallet conectada
                </div>
                {hasErrorB && (
                  <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: 600, color: DS.colors.errFg }}>
                    Ingresa un monto mayor a 0
                  </div>
                )}
              </div>

              {/* Right: Meta & Select */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, color: DS.colors.textMuted }}>
                  cuando alguien ejecute
                </span>
                <FluidDropdown
                  categories={tokenCategories}
                  selectedId={tokB}
                  onChange={(id) => {
                    if (id === tokA) {
                      setTokA(tokB);
                    }
                    setTokB(id);
                  }}
                  className="w-[190px]"
                />
              </div>
            </div>
          </div>


        </form>


      </div>

      {/* Form Footer: Primary CTA */}
      <div style={{
        marginTop: "auto",
        padding: "24px 28px",
        borderTop: `1px solid ${DS.colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "32px"
      }}>
        <p style={{
          fontSize: "13px",
          color: DS.colors.textSecondary,
          maxWidth: "320px",
          lineHeight: "1.6",
          margin: 0
        }}>
          Al crear, los tokens se transfieren al contrato escrow. Podrás cancelar mientras esté Activa.
        </p>

        <button
          type="submit"
          form="create-op-form"
          disabled={!canSubmit}
          style={{
            width: "auto",
            whiteSpace: "nowrap",
            fontSize: "15px",
            fontWeight: 700,
            padding: "14px 32px",
            background: !canSubmit ? DS.colors.textMuted : DS.colors.brand,
            color: "white",
            border: "none",
            borderRadius: DS.radius.md,
            cursor: !canSubmit ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            boxShadow: !canSubmit ? "none" : DS.shadow.brand,
            transition: "all 0.2s",
            opacity: !canSubmit ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (canSubmit) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 25px rgba(91,82,229,.45)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "none";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = canSubmit ? DS.shadow.brand : "none";
          }}
        >
          {isSubmitting ? (
            <>
              <Check size={16} strokeWidth={2.5} />
              {submitLabel || "Procesando…"}
            </>
          ) : (
            <>
              Crear operación
              <Plus size={18} strokeWidth={3} />
            </>
          )}
        </button>
      </div>
    </div>

      {/* PREVIEW CARD */}
      <aside style={{ height: "100%" }}>
        <div
          style={{
            background: DS.colors.surface,
            border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.lg,
            boxShadow: DS.shadow.card,
            height: "100%",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{ padding: "28px 28px 0 28px", flex: 1 }}>
            <div style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary }}>
              Resumen de la operación
            </h4>
            <p style={{ fontSize: "12px", color: DS.colors.textSecondary, marginTop: "6px", lineHeight: 1.5, maxWidth: "260px" }}>
              Verifica los detalles antes de confirmar y transferir los tokens al contrato escrow.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
              <span style={{ color: DS.colors.textMuted, fontWeight: 500 }}>Entregas</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: DS.colors.textPrimary, fontWeight: 700 }}>{fmtPreview(amountA, tokA)}</span>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.brand, backgroundColor: DS.colors.brandSoft, padding: "2px 6px", borderRadius: "4px" }}>
                  {symA}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
              <span style={{ color: DS.colors.textMuted, fontWeight: 500 }}>Recibes</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: DS.colors.textPrimary, fontWeight: 700 }}>{fmtPreview(amountB, tokB)}</span>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.okFg, backgroundColor: DS.colors.okBg, padding: "2px 6px", borderRadius: "4px" }}>
                  {symB}
                </span>
              </div>
            </div>
            <div style={{ borderTop: `1px dashed ${DS.colors.border}`, margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
              <span style={{ color: DS.colors.textMuted, fontWeight: 500 }}>Tasa</span>
              <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.textPrimary }}>
                {rate === "—" ? "—" : `1 ${symA} = ${rate} ${symB}`}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
              <span style={{ color: DS.colors.textMuted, fontWeight: 500 }}>Gas estimado</span>
              <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.textPrimary }}>
                ~0.0021 ETH
              </span>
            </div>
          </div>

          <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: `1px solid ${DS.colors.border}` }}>
            {[
              { n: "1", t: "Tus tokens quedan bloqueados en el contrato hasta que otro usuario ejecute la operación." },
              { n: "2", t: "El swap es atómico: ambas transferencias ocurren en la misma transacción on-chain." },
              { n: "3", t: "Puedes cancelar en cualquier momento mientras esté Activa." },
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", fontSize: "12px", color: DS.colors.textSecondary, lineHeight: 1.5, marginBottom: i < 2 ? "10px" : 0 }}>
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: DS.colors.brandSoft,
                    color: DS.colors.brand,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    fontSize: "11px",
                    fontWeight: 800,
                    marginTop: "1px",
                  }}
                >
                  {tip.n}
                </div>
                <p>{tip.t}</p>
              </div>
            ))}
          </div>

          </div>
          <div style={{ marginTop: "auto", padding: "14px 28px 20px", borderTop: `1px solid ${DS.colors.border}`, display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: DS.colors.textMuted }}>
            <ShieldCheck size={13} />
            <span>Swap atómico — ambas transferencias en una sola TX</span>
          </div>
        </div>
      </aside>
    </div>
  );
}


// ============================================================
// MAIN APP PAGE — Exact replica of HTML dashboard
// ============================================================

// Map contract uint8 state to EscrowState string
const CONTRACT_STATE: Record<number, EscrowState> = {
  0: "Active",
  1: "Completed",
  2: "Cancelled",
};

export function DashboardPage({ initialAddress }: { initialAddress: string | null }) {
  const [activeTab, setActiveTab] = useState<TabType>("mine");
  const [filterState, setFilterState] = useState<EscrowState | "all">("all");
  const [filterAvailable, setFilterAvailable] = useState<string>("all");
  const [operations, setOperations] = useState<MockOperation[]>([]);
  const [tokenRegistry, setTokenRegistry] = useState<Record<string, Token>>({});
  const [walletBalances, setWalletBalances] = useState<Record<string, string>>({});
  const [escrowBalances, setEscrowBalances] = useState<Record<string, string>>({});
  const [errorModal, setErrorModal] = useState<{ title: string; detail: string } | null>(null);

  const router = useRouter();
  const { account, chainId, status, disconnect, provider, signer } = useEthereumContext();
  const { sessionAddress } = useSession();

  // initialAddress viene del servidor (cookie) → sin flicker en primer render
  const walletAddress = account ?? sessionAddress ?? initialAddress ?? "";

  // Redirect al desconectar manualmente (el middleware cubre el resto)
  useEffect(() => {
    if (status === "disconnected") {
      router.replace("/");
    }
  }, [status, router]);

  // Load token registry (symbols + decimals) for all allowed tokens
  const loadTokenRegistry = async () => {
    if (!provider) return;
    try {
      const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const addresses: string[] = await escrow.getAllowedTokens();
      const registry: Record<string, Token> = {};
      await Promise.all(
        addresses.map(async (addr: string) => {
          const erc20 = new Contract(addr, ERC20_ABI, provider);
          const [symbol, decimals] = await Promise.all([erc20.symbol(), erc20.decimals()]);
          registry[addr.toLowerCase()] = { symbol: String(symbol), address: addr, decimals: Number(decimals) };
        })
      );
      setTokenRegistry(registry);
      return registry;
    } catch {
      return {};
    }
  };

  // Load real on-chain balances for the connected wallet and the Escrow contract
  const loadBalances = async (registry: Record<string, Token>) => {
    if (!provider || !walletAddress) return;
    try {
      const wallet: Record<string, string> = {};
      const escrow: Record<string, string> = {};
      await Promise.all(
        Object.values(registry).map(async (token) => {
          const erc20 = new Contract(token.address, ERC20_ABI, provider);
          const [walletRaw, escrowRaw]: [bigint, bigint] = await Promise.all([
            erc20.balanceOf(walletAddress),
            erc20.balanceOf(ESCROW_ADDRESS),
          ]);
          wallet[token.symbol] = formatAmount(walletRaw, token.decimals);
          escrow[token.symbol] = formatAmount(escrowRaw, token.decimals);
        })
      );
      setWalletBalances(wallet);
      setEscrowBalances(escrow);
    } catch {
      // silent
    }
  };

  // Load all operations from contract and map to MockOperation shape
  const loadOperations = async (registry?: Record<string, Token>) => {
    if (!provider) return;
    const reg = registry ?? tokenRegistry;
    try {
      const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const raw = await escrow.getAllOperations();

      const resolveToken = async (address: string): Promise<Token> => {
        const cached = reg[address.toLowerCase()];
        if (cached) return cached;
        // I11: never assume decimals=18 — read from chain
        const erc20 = new Contract(address, ERC20_ABI, provider);
        const [symbol, decimals] = await Promise.all([erc20.symbol(), erc20.decimals()]);
        return { symbol: String(symbol), address, decimals: Number(decimals) };
      };

      const mapped: MockOperation[] = await Promise.all(raw.map(async (op: {
        id: bigint; creator: string; tokenA: string; tokenB: string;
        amountA: bigint; amountB: bigint; state: number;
        executor: string; createdAt: bigint; closedAt: bigint; deadline: bigint;
      }) => {
        const [tokA, tokB] = await Promise.all([
          resolveToken(op.tokenA),
          resolveToken(op.tokenB),
        ]);
        return {
          id: Number(op.id),
          state: CONTRACT_STATE[Number(op.state)] ?? "Cancelled",
          creator: op.creator,
          executor: op.executor !== "0x0000000000000000000000000000000000000000" ? op.executor : undefined,
          tokenA: tokA,
          tokenB: tokB,
          amountA: op.amountA,
          amountB: op.amountB,
          createdAt: Number(op.createdAt) * 1000,
          closedAt: Number(op.closedAt) > 0 ? Number(op.closedAt) * 1000 : undefined,
        };
      }));
      setOperations(mapped);
    } catch {
      // provider not ready yet — silent
    }
  };

  // Initial load when provider becomes available
  useEffect(() => {
    if (provider && status === "connected") {
      loadTokenRegistry().then((reg) => {
        if (reg) {
          loadOperations(reg);
          loadBalances(reg);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, status, walletAddress]);

  const myOps = operations.filter((op) => op.creator.toLowerCase() === walletAddress.toLowerCase());
  const availableOps = operations.filter(
    (op) => op.creator.toLowerCase() !== walletAddress.toLowerCase() && op.state === "Active"
  );

  const registryTokens = Object.values(tokenRegistry);
  const symFirst  = registryTokens[0]?.symbol ?? "";
  const symSecond = registryTokens[1]?.symbol ?? "";

  const stats = {
    totalOps: myOps.length,
    activeOps: myOps.filter((op) => op.state === "Active").length,
    completedOps: myOps.filter((op) => op.state === "Completed").length,
    totalVolumeA: myOps.filter((op) => op.state === "Active").reduce((sum, op) => sum + Number(op.amountA) / Math.pow(10, op.tokenA.decimals), 0),
    totalVolumeB: myOps.filter((op) => op.state === "Active").reduce((sum, op) => sum + Number(op.amountB) / Math.pow(10, op.tokenB.decimals), 0),
  };

  const filteredOps = filterState === "all" ? myOps : myOps.filter((op) => op.state === filterState);

  const filteredAvailable = availableOps.filter((op) => {
    if (filterAvailable === "all") return true;
    if (filterAvailable === "pair-ab") return op.tokenA.symbol === symFirst  && op.tokenB.symbol === symSecond;
    if (filterAvailable === "pair-ba") return op.tokenA.symbol === symSecond && op.tokenB.symbol === symFirst;
    return true;
  });

  const filterCounts = {
    all: myOps.length,
    Active: myOps.filter((op) => op.state === "Active").length,
    Completed: myOps.filter((op) => op.state === "Completed").length,
    Cancelled: myOps.filter((op) => op.state === "Cancelled").length,
  };

  // Build dropdown categories from real token registry
  const tokenCategories: Category[] = Object.values(tokenRegistry).map((t, i) => ({
    id: t.symbol,
    label: t.symbol,
    icon: i % 2 === 0 ? Coins : Gem,
    color: TOKEN_ICON_COLORS[i % TOKEN_ICON_COLORS.length],
    subtitle: formatAddress(t.address),
    copyValue: t.address,
  }));

  const handleCreateOp = () => {
    setActiveTab("mine");
    loadOperations();
    loadBalances(tokenRegistry);
  };

  const handleValidateExecute = async (id: number): Promise<boolean> => {
    if (!signer) return false;
    const op = operations.find((o) => o.id === id);
    if (!op) return false;
    try {
      const tokenBContract = new Contract(op.tokenB.address, ERC20_ABI, signer);
      const balance: bigint = await tokenBContract.balanceOf(await signer.getAddress());
      if (balance < op.amountB) {
        const have = formatAmount(balance, op.tokenB.decimals);
        const need = formatAmount(op.amountB, op.tokenB.decimals);
        setErrorModal({
          title: "Saldo insuficiente",
          detail: `Tu wallet no tiene suficiente ${op.tokenB.symbol} para ejecutar este swap. Necesitas ${need} ${op.tokenB.symbol} pero solo tienes ${have} ${op.tokenB.symbol}.`,
        });
        return false;
      }
      return true;
    } catch {
      return true; // si el check falla por red, deja pasar — el contrato lo rechazará
    }
  };

  const handleExecute = async (id: number) => {
    if (!signer) return;
    const op = operations.find((o) => o.id === id);
    if (!op) return;
    try {
      const tokenBContract = new Contract(op.tokenB.address, ERC20_ABI, signer);

      toast.loading("Paso 1/2 — Aprobando tokenB…", { id: `exec-${id}` });
      // I14: reset allowance a 0 solo si ya hay allowance previa
      const userAddress = await signer.getAddress();
      const currentAllowanceB: bigint = await tokenBContract.allowance(userAddress, ESCROW_ADDRESS);
      if (currentAllowanceB > BigInt(0)) {
        const resetTx = await tokenBContract.approve(ESCROW_ADDRESS, 0);
        await resetTx.wait();
      }
      const approveTx = await tokenBContract.approve(ESCROW_ADDRESS, op.amountB);
      await approveTx.wait();
      toast.loading("Paso 2/2 — Completando operación…", { id: `exec-${id}` });
      const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tx = await escrow.completeOperation(id);
      await tx.wait();
      toast.success("Swap ejecutado — tokens intercambiados", { id: `exec-${id}` });
      loadOperations();
      loadBalances(tokenRegistry);
    } catch (err) {
      toast.dismiss(`exec-${id}`);

      // Intentar decodificar ERC20InsufficientBalance con contexto completo de la operación
      const errData = (() => {
        if (!err || typeof err !== "object") return null;
        const e = err as Record<string, unknown>;
        if (typeof e.data === "string" && e.data.startsWith("0x")) return e.data;
        const infoErr = (e.info as Record<string, unknown> | undefined)?.error as Record<string, unknown> | undefined;
        if (typeof infoErr?.data === "string") return infoErr.data as string;
        return null;
      })();

      if (errData) {
        try {
          const iface = new Interface(["error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)"]);
          const decoded = iface.parseError(errData);
          if (decoded?.name === "ERC20InsufficientBalance") {
            const have = formatAmount(decoded.args[1] as bigint, op.tokenB.decimals);
            const need = formatAmount(decoded.args[2] as bigint, op.tokenB.decimals);
            setErrorModal({
              title: "Saldo insuficiente",
              detail: `Tu wallet no tiene suficiente ${op.tokenB.symbol} para ejecutar este swap. Necesitas ${need} ${op.tokenB.symbol} pero solo tienes ${have} ${op.tokenB.symbol}.`,
            });
            return;
          }
        } catch { /* no era ERC20InsufficientBalance, continuar */ }
      }

      const msg = parseContractError(err);
      if (msg) setErrorModal({ title: "Transacción rechazada", detail: msg });
      // user rejected silently (msg === "")
    }
  };

  const handleCancel = async (id: number) => {
    if (!signer) return;
    try {
      toast.loading("Cancelando operación…", { id: `cancel-${id}` });
      const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tx = await escrow.cancelOperation(id);
      await tx.wait();
      toast.success("Operación cancelada — tokens devueltos", { id: `cancel-${id}` });
      loadOperations();
      loadBalances(tokenRegistry);
    } catch (err) {
      const msg = parseContractError(err);
      if (msg) toast.error(msg, { id: `cancel-${id}` });
      else toast.dismiss(`cancel-${id}`);
    }
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayAddress = formatAddress(walletAddress);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: DS.colors.bgPage }}>
      {/* TOPBAR - Mismo diseño que landing page */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          backgroundColor: DS.colors.surface,
          borderColor: DS.colors.border,
        }}
      >
        <div className="w-full mx-auto flex items-center justify-between" style={{ maxWidth: "1200px", padding: "16px 32px" }}>
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-default">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white"
              style={{ backgroundColor: DS.colors.brand }}
            >
              <Network size={16} strokeWidth={2} />
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: DS.colors.textPrimary }}
            >
              Dezentra
            </span>
          </div>

          {/* Right: Wallet Dropdown */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                aria-label="Menú de billetera"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: dropdownOpen ? DS.colors.bgPage : DS.colors.surfaceIn,
                  borderColor: dropdownOpen ? `${DS.colors.brand}4d` : DS.colors.border,
                  ...(dropdownOpen && {
                    boxShadow: `0 0 0 2px ${DS.colors.brand}19`,
                  }),
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: DS.colors.okFg }}
                />
                <span className="hidden sm:inline">{displayAddress}</span>
                <ChevronDown
                  className="w-3 h-3"
                  style={{
                    transition: "transform 0.2s",
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  role="menu"
                  aria-label="Opciones de billetera"
                  className="absolute top-full right-0 mt-3 w-72 rounded-2xl overflow-hidden z-[60] border shadow-2xl"
                  style={{
                    backgroundColor: DS.colors.surface,
                    borderColor: DS.colors.border,
                    boxShadow: DS.shadow.pop,
                  }}
                >
                  {/* Header Section */}
                  <div
                    className="p-5 border-b"
                    style={{
                      borderColor: DS.colors.border,
                      backgroundColor: DS.colors.surfaceIn,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span style={{ color: DS.colors.textMuted }}>Billetera activa</span>
                      <span
                        className="px-2 py-0.5 rounded border text-xs"
                        style={
                          chainId !== null && chainId !== 31337
                            ? {
                                backgroundColor: `${DS.colors.errFg}14`,
                                color: DS.colors.errFg,
                                borderColor: `${DS.colors.errFg}33`,
                              }
                            : {
                                backgroundColor: `${DS.colors.brand}14`,
                                color: DS.colors.brand,
                                borderColor: `${DS.colors.brand}33`,
                              }
                        }
                      >
                        {chainId !== null && chainId !== 31337 ? "Wrong Network" : "Anvil"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${DS.colors.brand}18` }}
                      >
                        <Wallet size={16} strokeWidth={2} style={{ color: DS.colors.brand }} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold" style={{ color: DS.colors.textPrimary }}>
                            {walletAddress ? formatAddress(walletAddress) : "—"}
                          </p>
                          <button
                            type="button"
                            onClick={handleCopy}
                            title="Copiar dirección completa"
                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px", color: DS.colors.textMuted, display: "flex", alignItems: "center" }}
                          >
                            {copied ? <Check size={11} style={{ color: DS.colors.okFg }} /> : <Copy size={11} />}
                          </button>
                        </div>
                        <p className="text-xs font-medium font-mono mt-1" style={{ color: DS.colors.textMuted }}>
                          {Object.entries(walletBalances).map(([sym, bal]) => `${bal} ${sym}`).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* En custodia — mismo layout que la fila wallet */}
                  {Object.values(escrowBalances).some((bal) => bal !== "0.00") && (
                    <div className="flex items-center gap-3 px-5 pb-5 pt-3 border-t" style={{ borderColor: DS.colors.border }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${DS.colors.brand}18` }}
                      >
                        <Lock size={16} strokeWidth={2} style={{ color: DS.colors.brand }} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold" style={{ color: DS.colors.textPrimary }}>
                          En custodia
                        </p>
                        <p className="text-xs font-medium font-mono mt-1" style={{ color: DS.colors.textMuted }}>
                          {Object.entries(escrowBalances).map(([sym, bal]) => `${bal} ${sym}`).join(" · ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      role="menuitem"
                      aria-label="Desconectar billetera"
                      onClick={() => {
                        setDropdownOpen(false);
                        disconnect();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{
                        backgroundColor: "transparent",
                        color: DS.colors.textMuted,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = `${DS.colors.errFg}0f`;
                        (e.currentTarget as HTMLElement).style.color = DS.colors.errFg;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLElement).style.color = DS.colors.textMuted;
                      }}
                    >
                      <div className="p-2 rounded-lg" style={{ backgroundColor: DS.colors.surfaceIn }}>
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold">Desconectar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SHELL: main container with padding */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 32px 80px", width: "100%" }}>

        {/* ─── STATS ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "16px", marginBottom: "24px", marginTop: "24px" }}>
          <StatCard label={`Ofrecido ${tokenCategories[0]?.label ?? ""}`} value={stats.totalVolumeA.toLocaleString("en-US", { maximumFractionDigits: 2 })} accent icon={Lock} unit={tokenCategories[0]?.label ?? ""} />
          <StatCard label={`Solicitado ${tokenCategories[1]?.label ?? ""}`} value={stats.totalVolumeB.toLocaleString("en-US", { maximumFractionDigits: 2 })} icon={ArrowRightLeft} color={DS.colors.okFg} unit={tokenCategories[1]?.label ?? ""} />
          <StatCard label="Total operaciones" value={stats.totalOps} icon={List} />
          <StatCard label="Activas" value={stats.activeOps} icon={Clock} color={DS.colors.warnFg} />
          <StatCard label="Completadas" value={stats.completedOps} icon={Check} color={DS.colors.okFg} />
        </div>

        {/* ─── TABS BAR ─── */}
        <div
          role="tablist"
          aria-label="Secciones del dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px",
            background: DS.colors.surface,
            border: `1px solid ${DS.colors.border}`,
            borderRadius: "9999px",
            boxShadow: DS.shadow.card,
            marginBottom: "20px",
            width: "fit-content",
          }}
        >
          {[
            { id: "mine", label: "Mis Operaciones", count: stats.totalOps },
            { id: "available", label: "Disponibles", count: availableOps.length },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 16px",
                fontSize: "13px",
                fontWeight: 600,
                color: activeTab === tab.id ? "white" : DS.colors.textSecondary,
                borderRadius: "9999px",
                cursor: "pointer",
                border: "none",
                background: activeTab === tab.id ? DS.colors.brand : "transparent",
                fontFamily: "inherit",
                transition: `all 200ms`,
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(91,82,229,.30)" : "none",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLElement).style.color = DS.colors.textPrimary;
                  (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surfaceIn;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLElement).style.color = DS.colors.textSecondary;
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 700, padding: "2px 7px", borderRadius: "9999px", backgroundColor: activeTab === tab.id ? "rgba(255,255,255,.22)" : DS.colors.surfaceIn, color: activeTab === tab.id ? "white" : DS.colors.textSecondary, lineHeight: 1.3 }}>
                {tab.count}
              </span>
              {tab.label}
            </button>
          ))}

          <button
            role="tab"
            aria-selected={activeTab === "new"}
            aria-controls="panel-new"
            onClick={() => setActiveTab("new")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: 600,
              color: activeTab === "new" ? "white" : DS.colors.okFg,
              borderRadius: "9999px",
              cursor: "pointer",
              border: "none",
              background: activeTab === "new" ? DS.colors.brand : DS.colors.okBg,
              fontFamily: "inherit",
              transition: `all 200ms`,
              boxShadow: activeTab === "new" ? "0 2px 8px rgba(91,82,229,.30)" : "none",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "new") {
                (e.currentTarget as HTMLElement).style.filter = "brightness(0.97)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "new") {
                (e.currentTarget as HTMLElement).style.filter = "brightness(1)";
              }
            }}
          >
            <Plus size={13} strokeWidth={3} />
            Nueva
          </button>
        </div>

        {/* ─── TAB CONTENT ─── */}

        {/* MIS OPERACIONES */}
        {activeTab === "mine" && (
          <section id="panel-mine" role="tabpanel" aria-labelledby="tab-mine" style={{ animation: "fadeIn 0.2s ease-out" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexShrink: 0 }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary }}>
                  Tus operaciones
                </h2>
                <span style={{ fontSize: "12px", color: DS.colors.textMuted }}>{filterCounts.all} totales</span>
              </div>

              {/* Filter Dropdown */}
              <FluidDropdown 
                className="w-[200px]"
                selectedId={filterState}
                onChange={(id) => setFilterState(id as EscrowState | "all")}
                categories={[
                  { id: "all", label: "Todas", icon: Layers, count: filterCounts.all, color: "#6366f1" },
                  { id: "Active", label: "Activas", icon: Activity, count: filterCounts.Active, color: "#D97706" },
                  { id: "Completed", label: "Completadas", icon: CheckCircle, count: filterCounts.Completed, color: "#16A34A" },
                  { id: "Cancelled", label: "Canceladas", icon: XCircle, count: filterCounts.Cancelled, color: "#DC2626" },
                ]}
              />
            </div>

            {filteredOps.length > 0 ? (
              <div className="ops-grid">
                {filteredOps.map((op) => (
                  <OperationCard key={op.id} op={op} isExecutable={false} isAvailable={false} onCancel={handleCancel} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 24px",
                  background: DS.colors.surface,
                  border: `1px dashed ${DS.colors.border}`,
                  borderRadius: DS.radius.xl,
                  minHeight: "440px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: DS.colors.brandSoft,
                    color: DS.colors.brand,
                    margin: "0 auto 16px",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <List size={26} strokeWidth={1.6} />
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.2px", color: DS.colors.textPrimary }}>
                  No hay operaciones en este filtro
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: DS.colors.textSecondary,
                    marginTop: "6px",
                    marginBottom: "18px",
                    maxWidth: "360px",
                    marginLeft: "auto",
                    marginRight: "auto",
                    lineHeight: 1.5,
                  }}
                >
                  Cambia de filtro para ver tu historial, o crea una nueva operación para empezar.
                </div>
                <button
                  onClick={() => setActiveTab("new")}
                  style={{
                    background: DS.colors.brand,
                    color: "white",
                    fontWeight: 700,
                    padding: "10px 22px",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: DS.shadow.brand,
                    transition: `all 200ms`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.brandHover;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.brand;
                  }}
                >
                  + Crear operación
                </button>
              </div>
            )}
          </section>
        )}

        {/* DISPONIBLES */}
        {activeTab === "available" && (
          <section id="panel-available" role="tabpanel" aria-labelledby="tab-available" style={{ animation: "fadeIn 0.2s ease-out" }}>


            {/* Panel Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexShrink: 0 }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary }}>
                  Operaciones disponibles
                </h2>
                <span style={{ fontSize: "12px", color: DS.colors.textMuted }}>
                  {filteredAvailable.length} listas para ejecutar
                </span>
              </div>

              <FluidDropdown 
                className="w-[200px]"
                selectedId={filterAvailable}
                onChange={(id) => setFilterAvailable(id)}
                categories={[
                  { id: "all",     label: "Todas",                                         icon: Layers,          color: "#6366f1" },
                  ...(symFirst && symSecond ? [
                    { id: "pair-ab", label: `${symFirst} → ${symSecond}`,  icon: ArrowRightLeft, color: "#3b82f6" },
                    { id: "pair-ba", label: `${symSecond} → ${symFirst}`,  icon: ArrowRightLeft, color: "#8b5cf6" },
                  ] : []),
                ]}
              />
            </div>

            {/* Grid */}
            {filteredAvailable.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "24px" }}>
                {filteredAvailable.map((op) => (
                  <OperationCard key={op.id} op={op} isExecutable={true} isAvailable={true} onExecute={handleExecute} onValidate={handleValidateExecute} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 24px",
                  background: DS.colors.surface,
                  border: `1px dashed ${DS.colors.border}`,
                  borderRadius: DS.radius.xl,
                  minHeight: "440px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: DS.colors.surfaceIn,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <List size={24} style={{ color: DS.colors.textMuted }} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textPrimary, marginBottom: "8px" }}>
                  No hay operaciones disponibles
                </h3>
                <p style={{ fontSize: "14px", color: DS.colors.textMuted }}>
                  Prueba seleccionando otro par de tokens o espera a que otros usuarios creen nuevas.
                </p>
              </div>
            )}
          </section>
        )}

        {/* + NUEVA */}
        {activeTab === "new" && (
          <section id="panel-new" role="tabpanel" aria-labelledby="tab-new" style={{ animation: "fadeIn 0.2s ease-out" }}>
            <CreateOperationForm onCreateOp={handleCreateOp} creatorAddress={walletAddress} signer={signer} tokenRegistry={tokenRegistry} tokenCategories={tokenCategories} walletBalances={walletBalances} />
          </section>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ERROR MODAL */}
      {errorModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
          }}
          onClick={() => setErrorModal(null)}
        >
          <div
            style={{
              background: DS.colors.surface, borderRadius: "20px",
              border: `1px solid ${DS.colors.border}`, width: "100%", maxWidth: "400px",
              padding: "28px 24px 24px", display: "flex", flexDirection: "column", gap: "20px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + title */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "var(--err-bg, #FEE2E2)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AlertCircle size={28} style={{ color: "var(--err-fg, #DC2626)" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <h2 id="error-modal-title" style={{ fontSize: "18px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0 }}>
                  {errorModal.title}
                </h2>
                <p style={{ fontSize: "13px", color: DS.colors.textMuted, marginTop: "4px" }}>
                  El contrato rechazó la operación.
                </p>
              </div>
            </div>

            {/* Error detail box */}
            <div style={{
              borderRadius: "12px", padding: "16px",
              background: "var(--err-bg, #FEE2E2)", border: "1px solid var(--err-fg, #DC2626)",
              display: "flex", flexDirection: "column", gap: "6px",
            }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--err-fg, #DC2626)", margin: 0 }}>
                Motivo
              </p>
              <p style={{ fontSize: "13px", color: "var(--err-fg, #DC2626)", margin: 0, lineHeight: 1.5 }}>
                {errorModal.detail}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setErrorModal(null)}
              style={{
                width: "100%", height: "44px", borderRadius: "12px", border: "none",
                background: "var(--err-fg, #DC2626)", color: "#fff",
                fontSize: "14px", fontWeight: 700, cursor: "pointer",
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
