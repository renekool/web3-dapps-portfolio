export interface Company {
  id: number;
  name: string;
  address: string;
  description?: string;
  isActive: boolean;
  registeredAt: string;
}

export const MOCK_COMPANIES: Company[] = [
  {
    id: 1,
    name: "Tech Solutions Inc.",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    description: "Desarrollo de software y soluciones IT innovadoras.",
    isActive: true,
    registeredAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Organic Foods Co.",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    description: "Distribución de alimentos orgánicos y sostenibles.",
    isActive: true,
    registeredAt: "2024-02-10",
  },
  {
    id: 3,
    name: "Luxury Watches Ltd.",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    description: "Relojes exclusivos de alta gama.",
    isActive: false,
    registeredAt: "2024-03-05",
  },
];
