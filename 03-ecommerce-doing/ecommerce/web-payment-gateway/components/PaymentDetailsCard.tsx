import { useState } from "react";
import { formatEURT } from "@/lib/web3/formatters";

const ANVIL_CHAIN_ID = 31337;

interface PaymentDetailsCardProps {
  merchantAddress: string;
  walletAddress?: string | null;
  balance?: bigint | null;
  amount: bigint;
  invoice: string;
  date: string;
  chainId?: number | null;
  onSwitchNetwork?: () => Promise<void>;
}

function truncateAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function PaymentDetailsCard({
  merchantAddress,
  walletAddress,
  balance,
  amount,
  invoice,
  date,
  chainId,
  onSwitchNetwork,
}: PaymentDetailsCardProps) {
  const isWrongNetwork = walletAddress != null && chainId != null && chainId !== ANVIL_CHAIN_ID;
  const [copiedMerchant, setCopiedMerchant] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const handleCopy = (address: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard?.writeText(address).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      width: "100%",
      background: "var(--card)",
      border: "1px solid rgba(218,193,185,0.55)",
      borderRadius: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(144,71,41,0.06)",
      overflow: "hidden",
      marginBottom: "16px",
    }}>

      {/* Amount hero */}
      <div style={{
        margin: "16px",
        background: "var(--background)",
        border: "1px solid rgba(218,193,185,0.55)",
        borderRadius: "14px",
        padding: "22px 20px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
      }}>
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
        }}>
          Total a pagar
        </div>

        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: "36px",
          fontWeight: 800,
          letterSpacing: "-1.2px",
          color: "var(--primary)",
          lineHeight: 1,
        }}>
          {formatEURT(amount)}
        </div>

        {/* Pill badges */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "100px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--foreground)",
            fontFamily: "var(--font-body)",
            whiteSpace: "nowrap",
          }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Factura {invoice}
          </span>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "100px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--foreground)",
            fontFamily: "var(--font-body)",
            whiteSpace: "nowrap",
          }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {date}
          </span>
        </div>
      </div>

      {/* Network status */}
      {isWrongNetwork ? (
        <div style={{
          margin: "0 16px 16px",
          padding: "10px 14px",
          background: "rgba(186,26,26,0.06)",
          border: "1px solid rgba(186,26,26,0.22)",
          borderRadius: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: onSwitchNetwork ? "8px" : 0 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--destructive)", flexShrink: 0 }} />
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--destructive)" }}>
              Red incorrecta
            </span>
            <span style={{
              marginLeft: "auto", fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "var(--destructive)",
              background: "rgba(186,26,26,0.10)", borderRadius: "6px", padding: "2px 7px",
            }}>
              {chainId === 1 ? "Mainnet" : `Chain ${chainId}`}
            </span>
          </div>
          {onSwitchNetwork && (
            <button
              onClick={onSwitchNetwork}
              style={{
                width: "100%", padding: "7px 0", borderRadius: "7px",
                background: "var(--destructive)", color: "#fff", border: "none",
                fontSize: "11.5px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em",
              }}
            >
              Cambiar a Anvil (localhost:8545)
            </button>
          )}
        </div>
      ) : (
        <div style={{
          margin: "0 16px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "9px 14px",
          background: "#eaf2e6",
          border: "1px solid rgba(70,103,57,0.20)",
          borderRadius: "10px",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--success)", letterSpacing: "0.01em" }}>
            Red disponible
          </span>
          <span style={{
            marginLeft: "auto", fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em",
            textTransform: "uppercase", color: "var(--success)",
            background: "rgba(70,103,57,0.12)", borderRadius: "6px", padding: "2px 7px",
          }}>
            Anvil
          </span>
        </div>
      )}

      {/* Wallet rows (if connected) */}
      {walletAddress && (
        <div style={{ borderTop: "1px solid rgba(218,193,185,0.55)" }}>
          {/* Balance Row */}
          <div style={{
            padding: "16px 20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}>
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--muted-foreground)",
              flexShrink: 0,
            }}>
              Balance:
            </span>
            <span style={{
              fontSize: "16px",
              fontFamily: "var(--font-body)",
              color: "var(--foreground)",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}>
              {balance != null ? formatEURT(balance) : "Cargando..."}
            </span>
          </div>
        </div>
      )}

      {/* Merchant row */}
      <div style={{
        padding: "14px 20px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        borderTop: "1px solid rgba(218,193,185,0.55)",
      }}>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--muted-foreground)",
          flexShrink: 0,
        }}>
          Comerciante:
        </span>
        <span style={{
          fontSize: "12px",
          fontFamily: "var(--font-body)",
          color: "var(--foreground)",
          fontWeight: 400,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          letterSpacing: "0.02em",
        }}>
          {truncateAddress(merchantAddress)}
          <button
            onClick={() => handleCopy(merchantAddress, setCopiedMerchant)}
            title="Copiar dirección"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "grid",
              placeItems: "center",
              color: "var(--muted-foreground)",
              borderRadius: "4px",
              transition: "background 0.15s",
            }}
          >
            {copiedMerchant ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
          </button>
        </span>
      </div>

    </div>
  );
}
