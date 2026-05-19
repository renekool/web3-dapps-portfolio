"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Wand2, Package, Plus, Search, CheckCircle2, ArrowRight, Home, Lock, Loader2, X } from "lucide-react";
import { ProductCard } from "@/components/modern-ui/ProductCard";
import { ProductFilter, FilterType } from "@/components/modern-ui/ProductFilter";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/modern-ui/button";
import { Input } from "@/components/modern-ui/input";
import { Badge } from "@/components/modern-ui/badge";
import { Card, CardContent } from "@/components/modern-ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/modern-ui/dialog";
import { Label } from "@/components/modern-ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/modern-ui/tooltip";

import { useWallet } from "@/lib/web3/WalletContext";
import { getEcommerceContract, getHttpProvider } from "@/lib/web3/contract";
import { ethers } from "ethers";

// ─── Types ───────────────────────────────────────────────────────────────────

// Redefining Product to match what ProductCard expects while using real blockchain data
interface Product {
  id: any; // Using any to avoid type conflicts with bigint/number in ProductCard
  companyId: any;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
}

const MOCK_SIMULATION_PRODUCTS = [
  "Wireless Earbuds", "Smartphone X1", "Laptop Pro", "Gaming Mouse", "Smartwatch Fit",
  "Mechanical Keyboard", "USB-C Hub", "4K Monitor", "Bluetooth Speaker", "External SSD",
  "Webcam HD", "Tablet Air", "VR Headset", "Noise Cancelling Headphones", "Portable Charger",
  "Dron Mini", "Action Camera", "E-reader", "Smart Light Bulb", "Wifi Router",
  "Gaming Chair", "Microphone Condenser", "Graphic Tablet", "Smart Plug", "Laptop Stand",
  "Electric Scooter", "Fitness Tracker", "Soundbar", "Home Security Camera", "Wireless Mouse"
];

export default function ProductsPage() {
  const { companyId, signer, companyInfo } = useWallet();
  const companyActive = companyInfo?.isActive ?? false;

  const [products, setProducts] = useState<Product[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: ""
  });

  const fetchProducts = useCallback(async () => {
    if (!companyId) return;

    try {
      const provider = getHttpProvider();
      const contract = getEcommerceContract(signer || provider);
      const productIds = await contract.getProductsByCompany(companyId);
      
      const formatted: Product[] = [];
      for (const id of productIds) {
        const p = await contract.getProduct(id);
        formatted.push({
          id: p.id,
          companyId: p.companyId,
          name: p.name,
          description: p.description,
          sku: `SKU-${p.id.toString().padStart(3, '0')}`,
          category: "General",
          price: parseFloat(ethers.formatUnits(p.price, 6)),
          stock: Number(p.stock),
          isActive: p.isActive
        });
      }
      setProducts(formatted);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }, [companyId, signer]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAdd = async () => {
    if (!signer || !companyId) return;
    setIsProcessing(true);
    try {
      const contract = getEcommerceContract(signer);
      const normalizedPrice = formData.price.replace(",", ".");
      const priceWei = ethers.parseUnits(normalizedPrice, 6);

      const tx = await contract.addProduct(formData.name, formData.description, priceWei, parseInt(formData.stock));
      console.log("TX enviada:", tx.hash);

      const receiptPromise = tx.wait();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TX_TIMEOUT")), 30_000)
      );

      console.log("Esperando confirmación...");
      const receipt = await Promise.race([receiptPromise, timeoutPromise]);
      console.log("TX confirmada:", receipt);

      toast.success("Producto registrado correctamente");
      setShowAdd(false);
      setFormData({ name: "", description: "", price: "", stock: "" });
      fetchProducts();
    } catch (err: any) {
      if (err?.code === "ACTION_REJECTED") {
        toast.error("Transacción cancelada.");
      } else if (err?.message === "TX_TIMEOUT") {
        toast.error("La transacción está tardando más de lo esperado. Verifica tu wallet.");
      } else {
        console.error("Error adding product:", err);
        toast.error("Error al registrar el producto");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!signer || !editingProduct) return;
    setIsProcessing(true);
    try {
      const contract = getEcommerceContract(signer);
      const normalizedPrice = editingProduct.price.toString().replace(",", ".");
      const priceWei = ethers.parseUnits(normalizedPrice, 6);

      const tx = await contract.updateProduct(
        editingProduct.id,
        editingProduct.name,
        editingProduct.description,
        priceWei,
        editingProduct.stock
      );
      console.log("TX enviada:", tx.hash);

      const receiptPromise = tx.wait();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TX_TIMEOUT")), 30_000)
      );

      console.log("Esperando confirmación...");
      const receipt = await Promise.race([receiptPromise, timeoutPromise]);
      console.log("TX confirmada:", receipt);

      toast.success("Producto actualizado");
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      if (err?.code === "ACTION_REJECTED") {
        toast.error("Transacción cancelada.");
      } else if (err?.message === "TX_TIMEOUT") {
        toast.error("La transacción está tardando más de lo esperado. Verifica tu wallet.");
      } else {
        console.error("Error updating product:", err);
        toast.error("Error al actualizar");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleStatus = async (id: any) => {
    if (!signer) return;
    try {
      const contract = getEcommerceContract(signer);
      const tx = await contract.toggleProductStatus(id);
      console.log("TX enviada:", tx.hash);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TX_TIMEOUT")), 30_000)
      );
      await Promise.race([tx.wait(), timeoutPromise]);
      fetchProducts();
    } catch (err: any) {
      if (err?.code === "ACTION_REJECTED") {
        toast.error("Transacción cancelada.");
      } else if (err?.message === "TX_TIMEOUT") {
        toast.error("La transacción está tardando más de lo esperado.");
      } else {
        console.error("Error toggling status:", err);
        toast.error("Error al cambiar estado");
      }
    }
  };

  const MOCK_DESCRIPTIONS = [
    "Producto de alta calidad con garantía de 2 años y soporte técnico incluido.",
    "Diseño ergonómico y materiales premium para máximo rendimiento y durabilidad.",
    "Compatibilidad universal con los principales sistemas operativos del mercado.",
    "Ideal para uso profesional y doméstico. Fácil instalación y configuración.",
    "Tecnología de última generación con conectividad inalámbrica de largo alcance.",
  ];

  const handleSimulate = () => {
    const randomName = MOCK_SIMULATION_PRODUCTS[Math.floor(Math.random() * MOCK_SIMULATION_PRODUCTS.length)];
    const randomDesc = MOCK_DESCRIPTIONS[Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)];
    const randomPrice = (Math.random() * 100 + 10).toFixed(2);
    const randomStock = Math.floor(Math.random() * 50) + 1;

    if (editingProduct) {
      setEditingProduct({ ...editingProduct, name: randomName, description: randomDesc, price: parseFloat(randomPrice), stock: randomStock });
    } else {
      setFormData({ name: randomName, description: randomDesc, price: randomPrice, stock: randomStock.toString() });
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === "all" ? true :
                           filter === "active" ? p.isActive :
                           filter === "inactive" ? !p.isActive :
                           filter === "low" ? (p.stock > 0 && p.stock <= 5) :
                           filter === "outOfStock" ? p.stock === 0 : true;
      return matchesSearch && matchesFilter;
    });
  }, [products, searchTerm, filter]);

  const counts = useMemo(() => ({
    all: products.length,
    active: products.filter(p => p.isActive).length,
    inactive: products.filter(p => !p.isActive).length,
    low: products.filter(p => p.stock > 0 && p.stock <= 5).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  }), [products]);

  return (
    <>
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Productos</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestión de productos registrados en el ecosistema.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} disabled={!companyActive} className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters/Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            className="pl-[40px] py-[12px] h-12 bg-muted/40 border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
              onClick={() => setSearchTerm("")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <ProductFilter currentFilter={filter} counts={counts} onFilterChange={setFilter} />
      </div>

      {/* GRID / Empty State */}
      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-9 h-9" />}
          title="Todavía no tienes productos creados"
          description={companyActive ? "Agrega productos con precios y stock para activarlo." : "La empresa está inactiva. Contacta al administrador para habilitarla."}
          actionLabel="Nuevo Producto"
          onAction={() => setShowAdd(true)}
          actionDisabled={!companyActive}
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id.toString()}
                product={product as any}
                onToggle={() => toggleStatus(product.id)}
                onEdit={setEditingProduct as any}
                canEdit={companyActive}
              />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No se encontraron productos para esta búsqueda.
            </div>
          )}
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Nuevo Producto</DialogTitle>
            <DialogDescription>
              Agrega un artículo a tu catálogo digital registrado en blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Nombre del Producto</Label>
              <Input
                id="add-name"
                placeholder="Ej. Wireless Earbuds"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-[12px] h-auto text-[14.5px] bg-muted/40 border border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-description">Descripción</Label>
                <span className="text-xs text-muted-foreground/60">{formData.description.length}/200</span>
              </div>
              <textarea
                id="add-description"
                placeholder="Describe brevemente el producto (opcional)"
                maxLength={200}
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 text-[14px] bg-muted/40 border border-border/40 rounded-xl focus:outline-none focus:border-primary/40 focus:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-price">Precio (EURT)</Label>
                <Input
                  id="add-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || parseFloat(val) >= 0) {
                      setFormData({ ...formData, price: val });
                    }
                  }}
                  className="px-4 py-[12px] h-auto text-[14.5px] bg-muted/40 border border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-stock">Stock Inicial</Label>
                <Input
                  id="add-stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || parseInt(val) >= 0) {
                      setFormData({ ...formData, stock: val });
                    }
                  }}
                  className="px-4 py-[12px] h-auto text-[14.5px] bg-muted/40 border border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all text-foreground"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="border-primary/20 text-primary hover:bg-primary/10 rounded-full w-10 h-10"
                    onClick={handleSimulate}
                  >
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generar datos de prueba</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowAdd(false)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isProcessing || !formData.name || !formData.price || !formData.stock}
                className="gap-2 min-w-[140px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Registrar Producto
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Editar Producto</DialogTitle>
            <DialogDescription>
              Actualiza los detalles del producto en el catálogo digital.
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre del Producto</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="px-4 py-[12px] h-auto text-[14.5px] bg-muted/40 border border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <span className="text-xs text-muted-foreground/60">{(editingProduct.description || "").length}/200</span>
                </div>
                <textarea
                  id="edit-description"
                  placeholder="Describe brevemente el producto (opcional)"
                  maxLength={200}
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-3 text-[14px] bg-muted/40 border border-border/40 rounded-xl focus:outline-none focus:border-primary/40 focus:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Precio (EURT)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEditingProduct({ ...editingProduct, price: isNaN(val) ? 0 : Math.max(0, val) });
                    }}
                    className="px-4 py-[12px] h-auto text-[14.5px] bg-muted/40 border border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock Disponible</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={editingProduct.stock}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setEditingProduct({ ...editingProduct, stock: isNaN(val) ? 0 : Math.max(0, val) });
                    }}
                    className="px-4 py-[12px] h-auto text-[14.5px] bg-muted/40 border border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="border-primary/20 text-primary hover:bg-primary/10 rounded-full w-10 h-10"
                    onClick={handleSimulate}
                  >
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generar datos de prueba</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditingProduct(null)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isProcessing}
                className="gap-2 min-w-[140px]"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
