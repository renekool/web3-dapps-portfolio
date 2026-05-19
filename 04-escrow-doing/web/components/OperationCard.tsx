"use client";

import { useState } from "react";
import {
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { DS } from "@/lib/design-system";
import {
  formatAddress,
  formatAmount,
  getStateLabel,
  type MockOperation,
  type EscrowState,
} from "@/lib/mockData";

const STATE_COLORS: Record<EscrowState, { bg: string; fg: string }> = {
  Active: { bg: "#FEF3C7", fg: "#D97706" },
  Completed: { bg: "#DCFCE7", fg: "#16A34A" },
  Cancelled: { bg: "#FEE2E2", fg: "#DC2626" },
};

function ConfirmModal({ op, isAvailable, onClose }: { op: MockOperation; isAvailable?: boolean; onClose: () => void }) {
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
        aria-labelledby="opcard-confirm-title"
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
          <h2 id="opcard-confirm-title" style={{ fontSize: "16px", fontWeight: 800, color: DS.colors.textPrimary }}>
            Ejecutar Operación <span style={{ fontFamily: "var(--font-mono)" }}>#{op.id}</span>
          </h2>
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
              {formatAmount(isAvailable ? op.amountA : op.amountB, isAvailable ? op.tokenA.decimals : op.tokenB.decimals)}{" "}
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.brand, backgroundColor: DS.colors.brandSoft, padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>
                {isAvailable ? op.tokenA.symbol : op.tokenB.symbol}
              </span>
            </div>
          </div>

          <ArrowRight size={18} strokeWidth={2} style={{ color: DS.colors.textMuted }} />

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: DS.colors.textMuted, marginBottom: "4px" }}>
              Recibes
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px", color: DS.colors.textPrimary }}>
              {formatAmount(isAvailable ? op.amountB : op.amountA, isAvailable ? op.tokenB.decimals : op.tokenA.decimals)}{" "}
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: DS.colors.okFg, backgroundColor: DS.colors.okBg, padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>
                {isAvailable ? op.tokenB.symbol : op.tokenA.symbol}
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
                borderTop: i > 0 ? `1px dashed #F3F4F8` : "none",
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
            onClick={() => {
              if (stepIdx < 4) {
                setStepIdx(stepIdx + 1);
              } else {
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

const CardShell = ({ children }: { children: React.ReactNode }) => (
  <article
    style={{
      background: DS.colors.surface,
      border: `1px solid ${DS.colors.border}`,
      borderRadius: DS.radius.lg,
      boxShadow: DS.shadow.card,
      transition: `all 200ms`,
    }}
  >
    {children}
  </article>
);

const HeaderRow = ({ title, status, colors }: { title: string; status: string; colors: any }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "20px 24px", borderBottom: `1px solid ${DS.colors.border}` }}>
    <span style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textPrimary, letterSpacing: "-0.2px", display: "flex", alignItems: "center" }}>
      Operación <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: "6px" }}>{title}</span>
    </span>
    <span style={{ fontSize: "12px", fontWeight: 600, padding: "6px 14px", backgroundColor: colors.bg, color: colors.fg, borderRadius: "9999px", flexShrink: 0 }}>
      {status}
    </span>
  </div>
);

const SwapBlock = ({ side, label, amount, symbol, tokenColor }: { side: "left" | "right"; label: string; amount: string; symbol: string; tokenColor: string }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", minWidth: 0 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start", minWidth: 0 }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: DS.colors.textMuted, marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", minWidth: 0 }}>
        <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: DS.colors.textPrimary, lineHeight: 1.1, whiteSpace: "nowrap" }}>
          {amount}
        </span>
        <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: tokenColor, backgroundColor: tokenColor === DS.colors.brand ? DS.colors.brandSoft : DS.colors.okBg, padding: "3px 8px", borderRadius: "4px", flexShrink: 0 }}>
          {symbol}
        </span>
      </div>
    </div>
  </div>
);

const MetadataItem = ({ label, address, onCopy, copied }: { label: string; address?: string; onCopy?: (addr: string) => void; copied?: string }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
    <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: DS.colors.textMuted }}>
      {label}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
      {address ? (
        <>
          <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 600, color: DS.colors.textPrimary, whiteSpace: "nowrap" }}>
            {formatAddress(address)}
          </span>
          <button
            onClick={() => onCopy?.(address)}
            style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "transparent", color: DS.colors.textMuted, cursor: "pointer", display: "grid", placeItems: "center", transition: `all 100ms` }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surfaceIn; (e.currentTarget as HTMLElement).style.color = DS.colors.brand; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = DS.colors.textMuted; }}
          >
            {copied === address ? <Check size={10} /> : <Copy size={10} />}
          </button>
        </>
      ) : (
        <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 400, color: DS.colors.textMuted, fontStyle: "italic" }}>
          pendiente
        </span>
      )}
    </div>
  </div>
);

export function AvailableCard({ op, isExecutable }: { op: MockOperation; isExecutable?: boolean }) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [copied, setCopied] = useState("");
  const colors = STATE_COLORS[op.state];
  const opNum = op.id.toString();

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    toast.success("Dirección copiada");
    setTimeout(() => setCopied(""), 1200);
  };

  return (
    <>
      <article
        style={{
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.lg,
          width: "100%",
          maxWidth: "520px",
          margin: "0 auto",
          boxShadow: DS.shadow.card,
          transition: `all 200ms`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "18px 24px 2px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textPrimary, display: "flex", alignItems: "center" }}>
            Operación <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: "6px" }}>#{opNum}</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.fg }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: colors.fg, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {getStateLabel(op.state)}
            </span>
          </div>
        </div>

        {/* Swap Block */}
        <div style={{ margin: "14px 24px 16px", padding: "16px 20px", backgroundColor: DS.colors.surfaceIn, borderRadius: DS.radius.md, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "16px", border: `1px solid ${DS.colors.border}40` }}>
          <SwapBlock side="left" label="Recibes" amount={formatAmount(op.amountB, op.tokenB.decimals)} symbol={op.tokenB.symbol} tokenColor={DS.colors.brand} />
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: DS.colors.surface, border: `1px solid ${DS.colors.border}`, display: "grid", placeItems: "center", color: DS.colors.brand, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
            <ArrowRight size={13} strokeWidth={2.5} />
          </div>
          <SwapBlock side="right" label="Entregas" amount={formatAmount(op.amountA, op.tokenA.decimals)} symbol={op.tokenA.symbol} tokenColor={DS.colors.okFg} />
        </div>

        {/* Metadata + Action Row (Sincronizado con la imagen) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 22px", borderTop: `1px solid ${DS.colors.border}60` }}>
          <MetadataItem label="Creador" address={op.creator} onCopy={handleCopy} copied={copied} />
          <button onClick={() => setOpenConfirm(true)} style={{ fontSize: "13px", fontWeight: 700, padding: "10px 24px", backgroundColor: DS.colors.brand, color: "white", border: "none", borderRadius: DS.radius.md, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: `all 150ms`, boxShadow: "0 4px 12px rgba(91,82,229,0.2)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.brandHover; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.brand; }}>
            Ejecutar <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </article>

      {openConfirm && <ConfirmModal op={op} isAvailable={true} onClose={() => setOpenConfirm(false)} />}
    </>
  );
}

export function OperationCard({ op, isExecutable }: { op: MockOperation; isExecutable?: boolean }) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [copied, setCopied] = useState("");
  const colors = STATE_COLORS[op.state];
  const opNum = op.id.toString();

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    toast.success("Dirección copiada");
    setTimeout(() => setCopied(""), 1200);
  };

  return (
    <>
      <article
        style={{
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.lg,
          width: "100%",
          maxWidth: "520px",
          margin: "0 auto",
          boxShadow: DS.shadow.card,
          transition: `all 200ms`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "18px 24px 2px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textPrimary, letterSpacing: "-0.2px", display: "flex", alignItems: "center" }}>
            Operación <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: "6px" }}>#{opNum}</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: colors.fg }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: colors.fg, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {getStateLabel(op.state)}
            </span>
          </div>
        </div>

        {/* Swap Block */}
        <div style={{ margin: "14px 24px 16px", padding: "16px 20px", backgroundColor: DS.colors.surfaceIn, borderRadius: DS.radius.md, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "16px", opacity: op.state === "Cancelled" ? 0.55 : 1, border: `1px solid ${DS.colors.border}40` }}>
          <SwapBlock side="left" label={op.state === "Active" ? "Ofreces" : "Entregaste"} amount={formatAmount(op.amountA, op.tokenA.decimals)} symbol={op.tokenA.symbol} tokenColor={DS.colors.brand} />
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: DS.colors.surface, border: `1px solid ${DS.colors.border}`, display: "grid", placeItems: "center", color: DS.colors.brand, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
            <ArrowRight size={13} strokeWidth={2.5} />
          </div>
          <SwapBlock side="right" label={op.state === "Active" ? "Solicitas" : "Recibiste"} amount={formatAmount(op.amountB, op.tokenB.decimals)} symbol={op.tokenB.symbol} tokenColor={DS.colors.okFg} />
        </div>

        {/* Metadata */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", padding: "0 44px 18px" }}>
          <MetadataItem label="Creador" address={op.creator} onCopy={handleCopy} copied={copied} />
          <MetadataItem label="Ejecutor" address={op.executor} onCopy={handleCopy} copied={copied} />
        </div>

        {/* Footer (Solo para Mis Operaciones) */}
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${DS.colors.border}`, backgroundColor: DS.colors.surfaceIn, display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: op.state === "Active" ? DS.colors.warnFg : op.state === "Completed" ? DS.colors.okFg : DS.colors.errFg }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textMuted }}>
              {op.state === "Active" ? "Esperando ejecutor" : op.state === "Completed" ? "Liquidada on-chain" : "Cancelada por ti"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {op.state === "Active" && (
              <button onClick={() => toast.info("Mock: cancelar operación")} style={{ fontSize: "12px", fontWeight: 700, padding: "8px 16px", backgroundColor: DS.colors.errBg, color: DS.colors.errFg, border: `1px solid ${DS.colors.errFg}20`, borderRadius: DS.radius.md, cursor: "pointer", transition: `all 150ms` }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = `${DS.colors.errFg}15`; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.errBg; }}>
                Cancelar
              </button>
            )}
            {(op.state === "Completed" || op.state === "Cancelled") && (
              <button onClick={() => toast.info("Mock: ver detalles")} style={{ fontSize: "12px", fontWeight: 700, padding: "8px 16px", backgroundColor: DS.colors.surface, color: DS.colors.textSecondary, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, cursor: "pointer", transition: `all 150ms` }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surfaceIn; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = DS.colors.surface; }}>
                Detalles
              </button>
            )}
          </div>
        </div>
      </article>

      {openConfirm && isExecutable && <ConfirmModal op={op} isAvailable={false} onClose={() => setOpenConfirm(false)} />}
    </>
  );
}
