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

export const MOCK_PRODUCTS: Product[] = [];
