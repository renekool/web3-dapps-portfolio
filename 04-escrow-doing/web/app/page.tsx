"use client";

import { Radio, Network } from "lucide-react";
import { DS } from "@/lib/design-system";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: DS.colors.bgPage,
        padding: "32px",
        gap: "0",
      }}
    >
      {/* Mark */}
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          backgroundColor: DS.colors.brand,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          marginBottom: "20px",
          boxShadow: DS.shadow.brand,
        }}
      >
        <Network size={26} strokeWidth={2} />
      </div>

      {/* Name */}
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          letterSpacing: "-0.75px",
          color: DS.colors.textPrimary,
          marginBottom: "12px",
          lineHeight: 1,
        }}
      >
        Dezentra
      </h1>

      {/* Statement */}
      <p
        style={{
          fontSize: "15px",
          color: DS.colors.textSecondary,
          lineHeight: 1.5,
          textAlign: "center",
          maxWidth: "320px",
          marginBottom: "32px",
        }}
      >
        Intercambio P2P de tokens ERC20. El contrato custodia ambos lados: ninguno puede incumplir.
      </p>

      {/* Network badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "5px 10px",
          borderRadius: "999px",
          backgroundColor: DS.colors.brandSoft,
          border: `1px solid ${DS.colors.brand}22`,
          fontSize: "11.5px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          color: DS.colors.brand,
          marginBottom: "32px",
        }}
      >
        <Radio size={11} strokeWidth={2.5} />
        Anvil · localhost:8545 · chainId 31337
      </div>

      {/* CTA */}
      <ConnectButton />

    </div>
  );
}
