import { ethers } from "ethers";

export function formatEURT(units: bigint): string {
  return ethers.formatUnits(units, 6);
}

export function parseEURT(euros: string): bigint {
  return ethers.parseUnits(euros, 6);
}

export function formatTimestamp(ts: bigint): string {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
