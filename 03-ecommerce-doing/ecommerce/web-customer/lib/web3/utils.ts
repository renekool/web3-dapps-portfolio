export function formatDate(ts: bigint | number): string {
  return new Date(Number(ts) * 1000).toLocaleDateString("es-ES");
}

export const PASARELA_URL = process.env.NEXT_PUBLIC_PASARELA_URL ?? "http://localhost:7002";
