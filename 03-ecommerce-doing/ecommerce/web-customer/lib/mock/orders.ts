export interface MockOrder {
  id: string;
  date: string; // ISO string
  amount: number; // cents
  status: "paid" | "pending";
}

export const MOCK_ORDERS: MockOrder[] = [
  { id: "INV-1", date: "2026-04-08T12:50:00Z", amount: 259, status: "paid" },
  { id: "INV-2", date: "2026-04-10T09:15:00Z", amount: 488, status: "pending" },
];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}
