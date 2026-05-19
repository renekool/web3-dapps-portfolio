export interface MockProduct {
  id: number;
  companyId: number;
  name: string;
  vendor: string;
  description: string;
  price: number; // in cents
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  vendorDescription?: string;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  { 
    id: 1, 
    companyId: 1, 
    name: "Webcam HD Pro", 
    vendor: "Logitech", 
    description: "Cámara web de alta definición con corrección de luz automática y micrófono integrado de largo alcance.", 
    price: 64280000, 
    stock: 120, 
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: 2, 
    companyId: 1, 
    name: "Bluetooth Speaker", 
    vendor: "JBL", 
    description: "Altavoz inalámbrico resistente al agua con sonido envolvente y 12 horas de autonomía constante.", 
    price: 222240000, 
    stock: 200, 
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: 3, 
    companyId: 1, 
    name: "Portable Charger", 
    vendor: "Anker", 
    description: "Batería externa de 20.000 mAh con carga ultra rápida y diseño compacto de aluminio aeroespacial.", 
    price: 17840000, 
    stock: 85, 
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: 4, 
    companyId: 2, 
    name: "Wireless Mouse", 
    vendor: "Logitech", 
    description: "Ratón ergonómico con sensor óptico de alta precisión y batería recargable vía USB-C.", 
    price: 34900000, 
    stock: 500, 
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: 5, 
    companyId: 2, 
    name: "Gaming Keyboard", 
    vendor: "Razer", 
    description: "Teclado mecánico con retroiluminación RGB personalizable y switches táctiles ultra rápidos.", 
    price: 129000000, 
    stock: 300, 
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800"
  }
];

export function formatEURT(units: number): string {
  return `${(units / 1000000).toFixed(2)} EURT`;
}
