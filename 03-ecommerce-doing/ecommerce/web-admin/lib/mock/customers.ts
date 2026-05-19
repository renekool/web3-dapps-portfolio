export interface Customer {
  address: string;
  registeredAt: string;
}

export const MOCK_CUSTOMERS: Customer[] = [
  { address: "0xf39F...2266", registeredAt: "2024-01-20" },
  { address: "0x7099...79C8", registeredAt: "2024-02-15" },
  { address: "0x3C44...93BC", registeredAt: "2024-03-10" },
  { address: "0xNEW...111",   registeredAt: "2024-04-01" },
];
