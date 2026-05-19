import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWalletAddress(address: string | null | undefined): string {
  if (!address) return "";
  const clean = address.replace(/[\.\s]/g, "");
  if (clean.length <= 12) return address; 
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

export const formatAddress = formatWalletAddress;
