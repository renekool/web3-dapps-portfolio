export interface InvoiceItem {
  productId: number;
  quantity: number;
  priceAtPurchase: number;
}

export interface Invoice {
  id: number;
  companyId: number;
  customerAddress: string;
  items: InvoiceItem[];
  totalAmount: number;
  createdAt: string;
  isPaid: boolean;
  paymentData?: {
    paidBy: string;
    amount: number;
    txHash: string;
    paidAt: string;
  };
}

export const MOCK_INVOICES: Invoice[] = [
  // companyId: 1 — pagadas (4)
  {
    id: 1001,
    companyId: 1,
    customerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    items: [{ productId: 1, quantity: 1, priceAtPurchase: 899 }],
    totalAmount: 899,
    createdAt: "2024-04-01 10:30",
    isPaid: true,
    paymentData: {
      paidBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      amount: 899,
      txHash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      paidAt: "2024-04-01 10:35",
    },
  },
  {
    id: 1004,
    companyId: 1,
    customerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    items: [
      { productId: 3, quantity: 2, priceAtPurchase: 249 },
      { productId: 5, quantity: 1, priceAtPurchase: 75 },
    ],
    totalAmount: 573,
    createdAt: "2024-04-05 11:20",
    isPaid: true,
    paymentData: {
      paidBy: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      amount: 573,
      txHash: "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
      paidAt: "2024-04-05 11:25",
    },
  },
  {
    id: 1005,
    companyId: 1,
    customerAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    items: [{ productId: 2, quantity: 3, priceAtPurchase: 45 }],
    totalAmount: 135,
    createdAt: "2024-04-08 09:15",
    isPaid: true,
    paymentData: {
      paidBy: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      amount: 135,
      txHash: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
      paidAt: "2024-04-08 09:18",
    },
  },
  {
    id: 1006,
    companyId: 1,
    customerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    items: [
      { productId: 4, quantity: 1, priceAtPurchase: 320 },
      { productId: 1, quantity: 1, priceAtPurchase: 899 },
    ],
    totalAmount: 1219,
    createdAt: "2024-04-12 16:45",
    isPaid: true,
    paymentData: {
      paidBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      amount: 1219,
      txHash: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
      paidAt: "2024-04-12 16:50",
    },
  },
  // companyId: 1 — pendientes (2)
  {
    id: 1002,
    companyId: 1,
    customerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    items: [{ productId: 2, quantity: 2, priceAtPurchase: 129 }],
    totalAmount: 258,
    createdAt: "2024-04-02 14:15",
    isPaid: false,
  },
  {
    id: 1007,
    companyId: 1,
    customerAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    items: [{ productId: 3, quantity: 5, priceAtPurchase: 249 }],
    totalAmount: 1245,
    createdAt: "2024-04-15 08:30",
    isPaid: false,
  },
  // companyId: 2 (no visible para company 1)
  {
    id: 1003,
    companyId: 2,
    customerAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    items: [{ productId: 3, quantity: 10, priceAtPurchase: 15 }],
    totalAmount: 150,
    createdAt: "2024-04-03 09:00",
    isPaid: true,
    paymentData: {
      paidBy: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      amount: 150,
      txHash: "0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
      paidAt: "2024-04-03 09:10",
    },
  },
];
