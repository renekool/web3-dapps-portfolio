export function generateMockTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export async function simulatePayment(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  if (Math.random() < 0.1) {
    throw new Error("Transacción rechazada por el simulador");
  }
}
