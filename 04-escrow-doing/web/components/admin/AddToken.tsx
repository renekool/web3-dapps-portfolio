"use client";

import { useState } from "react";
import { Contract } from "ethers";
import { Plus, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEthereumContext } from "@/lib/ethereum";
import { ESCROW_ADDRESS, ESCROW_ABI } from "@/lib/contracts";
import { parseContractError } from "@/lib/errors";
import { DS } from "@/lib/design-system";

const OWNER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Anvil #0

type TxState = "idle" | "signing" | "mining" | "done" | "error";

export function AddToken() {
  const { account, signer } = useEthereumContext();
  const [tokenAddress, setTokenAddress] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!account || account.toLowerCase() !== OWNER_ADDRESS.toLowerCase()) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !tokenAddress.trim()) return;

    setTxState("signing");
    setErrorMsg("");
    try {
      const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tx = await escrow.addToken(tokenAddress.trim());
      setTxState("mining");
      await tx.wait();
      setTxState("done");
      setTokenAddress("");
    } catch (err) {
      const msg = parseContractError(err);
      if (msg) setErrorMsg(msg);
      setTxState("error");
    }
  };

  const isLoading = txState === "signing" || txState === "mining";

  return (
    <div
      style={{
        background: DS.colors.surface,
        border: `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.lg,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Plus size={15} strokeWidth={2.5} style={{ color: DS.colors.brand }} />
        <span style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.textPrimary }}>
          Agregar Token
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: DS.radius.pill,
            backgroundColor: DS.colors.warnBg,
            color: DS.colors.warnFg,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Owner
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="0x… dirección del token"
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.md,
            backgroundColor: DS.colors.surfaceIn,
            color: DS.colors.textPrimary,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !tokenAddress.trim()}
          style={{
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: 700,
            backgroundColor: isLoading ? DS.colors.surfaceIn : DS.colors.brand,
            color: isLoading ? DS.colors.textMuted : "white",
            border: "none",
            borderRadius: DS.radius.md,
            cursor: isLoading || !tokenAddress.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
            opacity: !tokenAddress.trim() ? 0.6 : 1,
          }}
        >
          {isLoading && <Loader2 size={13} className="animate-spin" />}
          {txState === "signing" && "Firmando…"}
          {txState === "mining" && "Minando…"}
          {(txState === "idle" || txState === "done" || txState === "error") && "Agregar"}
        </button>
      </form>

      {txState === "done" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: DS.colors.okFg }}>
          <CheckCircle size={13} />
          Token agregado correctamente
        </div>
      )}
      {txState === "error" && errorMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: DS.colors.errFg }}>
          <AlertCircle size={13} />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
