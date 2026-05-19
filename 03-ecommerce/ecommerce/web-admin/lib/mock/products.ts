export interface Product {
  id: number;
  companyId: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    companyId: 1,
    name: "Camiseta Premium",
    sku: "SKU-001",
    category: "Ropa",
    price: 29.99,
    stock: 42,
    isActive: true,
  },
  {
    id: 2,
    companyId: 1,
    name: "Zapatillas Urban",
    sku: "SKU-002",
    category: "Calzado",
    price: 89.50,
    stock: 3,
    isActive: true,
  },
  {
    id: 3,
    companyId: 1,
    name: "Bolso de Cuero",
    sku: "SKU-003",
    category: "Accesorios",
    price: 149.00,
    stock: 0,
    isActive: false,
  },
  {
    id: 4,
    companyId: 1,
    name: "Reloj Clásico",
    sku: "SKU-004",
    category: "Relojes",
    price: 220.00,
    stock: 8,
    isActive: true,
  },
  {
    id: 5,
    companyId: 1,
    name: "Gorra Streetwear",
    sku: "SKU-005",
    category: "Ropa",
    price: 24.99,
    stock: 67,
    isActive: true,
  },
  {
    id: 6,
    companyId: 1,
    name: "Mochila Explorer",
    sku: "SKU-006",
    category: "Mochilas",
    price: 75.00,
    stock: 5,
    isActive: true,
  },
  {
    id: 7,
    companyId: 1,
    name: "Cinturón Artesanal",
    sku: "SKU-007",
    category: "Accesorios",
    price: 35.00,
    stock: 0,
    isActive: false,
  },
  {
    id: 8,
    companyId: 1,
    name: "Sudadera Oversize",
    sku: "SKU-008",
    category: "Ropa",
    price: 55.00,
    stock: 18,
    isActive: true,
  },
];
