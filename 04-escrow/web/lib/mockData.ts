/* ============================================================
   SwapEscrow — Mock Data for PB-06 Mockups
   Static data for Landing Page + App Interface mockups
   No real blockchain logic — visual testing only
   ============================================================ */

export type EscrowState = "Active" | "Completed" | "Cancelled";

export interface Token {
  symbol: string;
  address: string;
  decimals: number;
}

export interface MockOperation {
  id: number;
  state: EscrowState;
  creator: string;
  executor?: string;
  tokenA: Token;
  tokenB: Token;
  amountA: bigint;
  amountB: bigint;
  createdAt: number; // unix timestamp (ms)
  closedAt?: number;
}

export interface WalletState {
  connected: boolean;
  address?: string;
  balance?: {
    TKA: string;
    TKB: string;
  };
  chainId?: number;
}

// ============================================================
// TOKENS
// ============================================================

const TKA: Token = {
  symbol: "TKA",
  address: "0x1111111111111111111111111111111111111111",
  decimals: 18,
};

const TKB: Token = {
  symbol: "TKB",
  address: "0x2222222222222222222222222222222222222222",
  decimals: 18,
};

// ============================================================
// WALLET STATES
// ============================================================

export const MOCK_WALLET_DISCONNECTED: WalletState = {
  connected: false,
};

export const MOCK_WALLET_CONNECTED: WalletState = {
  connected: true,
  address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Anvil account #0
  balance: {
    TKA: "1000.00",
    TKB: "800.00",
  },
  chainId: 31337,
};

// ============================================================
// MY OPERATIONS (4 states of FSM)
// ============================================================

const now = Date.now();
const oneDayMs = 24 * 60 * 60 * 1000;
const threeDaysMs = 3 * oneDayMs;

// Anvil account #0 — wallet mock conectado (Owner en dev)
const MY_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
// Anvil account #1 y #2 — otros usuarios
const ADDR1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const ADDR2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

export const MY_OPERATIONS: MockOperation[] = [];

// ============================================================
// AVAILABLE OPERATIONS (ops by other creators, executable)
// ============================================================

export const AVAILABLE_OPERATIONS: MockOperation[] = [];

// ============================================================
// HELPER: All operations combined
// ============================================================

export const ALL_OPERATIONS: MockOperation[] = [
  ...MY_OPERATIONS,
  ...AVAILABLE_OPERATIONS,
];

// ============================================================
// HELPER: Format amount with proper decimals
// ============================================================

export function formatAmount(amount: bigint, decimals: number): string {
  const num = Number(amount) / Math.pow(10, decimals);
  if (isNaN(num)) return "0.00";
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    const val = num / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
  }
  if (abs >= 1_000) {
    const val = num / 1_000;
    const rounded = Math.round(val * 10) / 10; // 1 decimal rounding
    if (rounded >= 1_000) {
      // rounding would produce "1,000K" — promote to M
      const mVal = num / 1_000_000;
      return `${mVal % 1 === 0 ? mVal.toFixed(0) : mVal.toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
    }
    return `${val % 1 === 0 ? val.toFixed(0) : val.toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
  }
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================
// HELPER: Format address (truncate)
// ============================================================

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ============================================================
// HELPER: Get human-readable state
// ============================================================

export function getStateLabel(state: EscrowState): string {
  const labels: Record<EscrowState, string> = {
    Active: "Activa",
    Completed: "Completada",
    Cancelled: "Cancelada",
  };
  return labels[state] || state;
}

// ============================================================
// HELPER: Check if operation is mine (creator is current user)
// ============================================================

export function isMyOperation(
  op: MockOperation,
  userAddress: string
): boolean {
  return op.creator.toLowerCase() === userAddress.toLowerCase();
}

// ============================================================
// STATS computed from mock data
// ============================================================

export function computeStats(userAddress: string) {
  const myOps = MY_OPERATIONS.filter((op) => isMyOperation(op, userAddress));
  return {
    totalOps: myOps.length,
    activeOps: myOps.filter((op) => op.state === "Active").length,
    completedOps: myOps.filter((op) => op.state === "Completed").length,
    totalVolume: myOps.reduce((sum, op) => {
      return sum + Number(op.amountA) / Math.pow(10, op.tokenA.decimals);
    }, 0),
  };
}
