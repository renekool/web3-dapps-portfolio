// Maps contract revert reasons and ethers errors to human-readable messages.
// Never show hex or raw errors to the user — always route through here.

import { Interface } from "ethers";

// OZ v5 custom errors — needed to decode revert data from ERC20 tokens
const ERC20_ERROR_IFACE = new Interface([
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
]);

export function parseContractError(err: unknown): string {
  // Try to decode OZ v5 custom errors from raw revert data
  const data = extractData(err);
  if (data) {
    try {
      const decoded = ERC20_ERROR_IFACE.parseError(data);
      if (decoded?.name === "ERC20InsufficientBalance") return "No tienes saldo suficiente de tokens para completar este swap";
      if (decoded?.name === "ERC20InsufficientAllowance") return "Primero aprueba la transferencia del token";
    } catch { /* not an ERC20 custom error */ }
  }

  const msg = extractMessage(err);

  if (msg.includes("Tokens must differ"))   return "No puedes intercambiar un token por sí mismo";
  if (msg.includes("Amounts > 0"))          return "El monto debe ser mayor a cero";
  if (msg.includes("Operation expired"))    return "Esta oferta de swap ha expirado";
  if (msg.includes("Not active"))           return "Esta operación ya no está disponible";
  if (msg.includes("Not creator"))          return "Solo el creador puede cancelar esta operación";
  if (msg.includes("Is creator"))           return "No puedes completar tu propia operación";
  if (msg.includes("Token not allowed"))    return "Este token no está autorizado para operar";
  if (msg.includes("Insufficient allowance") || msg.includes("ERC20: insufficient allowance"))
                                            return "Primero aprueba la transferencia del token";
  if (msg.includes("ERC20InsufficientBalance"))
                                            return "No tienes saldo suficiente de tokens para completar este swap";
  if (msg.includes("insufficient funds"))   return "Fondos insuficientes para pagar el gas";
  if (msg.includes("OwnableUnauthorizedAccount"))
                                            return "Solo el propietario del contrato puede realizar esta acción";

  if (msg.includes("user rejected") || msg.includes("ACTION_REJECTED"))
    return "";

  if (msg.includes("already pending"))
    return "Ya hay una solicitud pendiente en tu wallet";

  return "Error inesperado. Revisa la consola para más detalles.";
}

function extractData(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  if (typeof e.data === "string" && e.data.startsWith("0x")) return e.data;
  // ethers v6 nested: err.info.error.data
  const info = e.info as Record<string, unknown> | undefined;
  const infoError = info?.error as Record<string, unknown> | undefined;
  if (typeof infoError?.data === "string") return infoError.data as string;
  return null;
}

function extractMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  const e = err as Record<string, unknown>;
  const infoMsg =
    e.info && typeof e.info === "object"
      ? ((e.info as Record<string, unknown>).error as Record<string, unknown> | undefined)?.message
      : undefined;
  const parts = [
    typeof e.reason === "string" ? e.reason : "",
    typeof e.shortMessage === "string" ? e.shortMessage : "",
    typeof infoMsg === "string" ? infoMsg : "",
    typeof e.message === "string" ? e.message : "",
    JSON.stringify(err),
  ];
  return parts.join(" ");
}
