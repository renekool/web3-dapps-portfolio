"use client";

import { useRouter } from "next/navigation";
import { Wallet, AlertTriangle, ArrowRight } from "lucide-react";
import { useEthereumContext } from "@/lib/ethereum";
import { DS } from "@/lib/design-system";

export function ConnectButton() {
  const { status, account, connect } = useEthereumContext();
  const router = useRouter();

  const handleConnect = async () => {
    const ok = await connect();
    if (ok) router.push("/dashboard");
  };

  // Cuenta activa — navegación en curso, no renderizar nada
  if (account) return null;

  // Sin wallet instalada — solo mensaje, sin botón
  if (status === "no-wallet") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 18px",
            borderRadius: DS.radius.md,
            backgroundColor: `${DS.colors.warnFg}10`,
            border: `1px solid ${DS.colors.warnFg}33`,
            fontSize: "13px",
            fontWeight: 600,
            color: DS.colors.warnFg,
          }}
        >
          <AlertTriangle size={14} strokeWidth={2.2} style={{ flexShrink: 0 }} />
          MetaMask o Rabby no detectado
        </div>
        <p style={{ fontSize: "12px", color: DS.colors.textMuted, margin: 0 }}>
          Instala una extensión de wallet para continuar
        </p>
      </div>
    );
  }

  const isConnecting = status === "connecting";

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "13px 24px",
        backgroundColor: isConnecting ? DS.colors.surfaceIn : DS.colors.brand,
        color: isConnecting ? DS.colors.textMuted : "white",
        border: "none",
        borderRadius: DS.radius.md,
        fontSize: "14px",
        fontWeight: 700,
        cursor: isConnecting ? "not-allowed" : "pointer",
        boxShadow: isConnecting ? "none" : DS.shadow.brand,
        transition: "all 0.15s ease-out",
        letterSpacing: "-0.1px",
        opacity: isConnecting ? 0.75 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isConnecting) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = DS.colors.brandHover;
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(91,82,229,.40)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isConnecting) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = DS.colors.brand;
          (e.currentTarget as HTMLButtonElement).style.transform = "none";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = DS.shadow.brand;
        }
      }}
    >
      <Wallet size={15} strokeWidth={2.2} />
      {isConnecting ? "Conectando…" : "Conectar Wallet"}
      {!isConnecting && <ArrowRight size={15} strokeWidth={2.5} />}
    </button>
  );
}
