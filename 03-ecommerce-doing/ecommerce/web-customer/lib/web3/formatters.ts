import { formatUnits, parseUnits } from "ethers";

/**
 * Formats EURT bigint to string with 6 decimals (raw)
 */
export function formatEURT(amount: bigint): string {
  return formatUnits(amount, 6);
}

/**
 * Parses string amount to EURT bigint with 6 decimals
 */
export function parseEURT(amount: string): bigint {
  return parseUnits(amount, 6);
}

/**
 * Formats EURT for display with 2 decimals and currency symbol
 * Example: 2590000 -> "2.59 EURT"
 */
export function formatEURTDisplay(amount: bigint): string {
  const formatted = formatUnits(amount, 6);
  const [whole, decimal] = formatted.split(".");
  const shortDecimal = (decimal ?? "00").slice(0, 2).padEnd(2, "0");
  return `${whole}.${shortDecimal} EURT`;
}
