"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingBag, Package } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { ProductCard } from "@/src/components/product/ProductCard";
import { useOrders } from "@/lib/contexts/OrdersContext";
import { useCart } from "@/lib/contexts/CartContext";
import { useWallet } from "@/lib/web3/WalletContext";
import { MockProduct } from "@/lib/mock/products";
import { getEcommerceContract } from "@/lib/web3/contracts";
import { ethers } from "ethers";

// Wrapper for ProductCard to manage its own state while staying reusable
function ProductCardItem({ product }: { product: MockProduct }) {
  const { addItem } = useCart();
  const { isConnected, connect } = useWallet();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleIncrement = () => {
    if (qty < product.stock) setQty(qty + 1);
  };

  const handleDecrement = () => {
    if (qty > 1) setQty(qty - 1);
  };

  const handleAddToCart = async () => {
    if (!isConnected) {
      connect();
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    await addItem(product, qty);
    toast.success(`${product.name} añadido al carrito`, {
      description: `${qty} uds. añadidas.`,
    });
    setLoading(false);
  };

  return (
    <ProductCard
      id={product.id.toString()}
      name={product.name}
      vendor={product.vendor}
      vendorDescription={product.vendorDescription}
      description={product.description}
      price={product.price}
      image={product.imageUrl || "/images/placeholder-product.jpg"}
      category="E-commerce"
      stock={product.stock}
      quantity={qty}
      onIncrement={handleIncrement}
      onDecrement={handleDecrement}
      onAddToCart={handleAddToCart}
      loading={loading}
      disabled={!isConnected}
    />
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { updateOrderStatus } = useOrders();
  const { address, refreshBalance } = useWallet();
  const handledRef = useRef(false);
  const [awaitingBalanceRefresh, setAwaitingBalanceRefresh] = useState(false);
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
        const fetchProvider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = getEcommerceContract(fetchProvider);
        const contractAddr = await contract.getAddress();
        console.log(`Fetching products from contract: ${contractAddr}`);

        if (!contractAddr || contractAddr === "0x0000000000000000000000000000000000000000") {
          throw new Error("Contract address is not configured correctly.");
        }
        
        let count = 0;
        try {
          count = Number(await contract.productCount());
        } catch (e) {
          console.error("Error calling productCount (is the contract deployed?):", e);
          setProducts([]);
          setLoading(false);
          return;
        }

        const productList: MockProduct[] = [];
        const companyCache: Record<number, { name: string, description: string }> = {};
        
        for (let i = 1; i <= count; i++) {
          try {
            const p = await contract.getProduct(i);
            if (!p.isActive) continue;

            const companyId = Number(p.companyId);
            if (!companyCache[companyId]) {
              const company = await contract.getCompanyById(companyId);
              companyCache[companyId] = { 
                name: company.name, 
                description: company.description 
              };
            }
            
            productList.push({
              id: Number(p.id),
              companyId: companyId,
              name: p.name,
              description: p.description,
              price: Number(p.price),
              stock: Number(p.stock),
              isActive: p.isActive,
              vendor: companyCache[companyId]?.name || "Proveedor Desconocido",
              vendorDescription: companyCache[companyId]?.description,
              imageUrl: "/images/placeholder-product.jpg"
            });
          } catch (e) {
            console.error(`Error fetching product #${i}:`, e);
          }
        }
        
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products from SC:", error);
        setProducts([]); // Empty state on error
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Mark order as paid exactly once when ?status=success is detected
  useEffect(() => {
    if (handledRef.current) return;
    const status = searchParams.get("status");
    const invoice = searchParams.get("invoice");
    if (status === "success" && invoice) {
      handledRef.current = true;
      updateOrderStatus(invoice, "paid");
      setAwaitingBalanceRefresh(true);
      toast.success("Pago confirmado", {
        description: `Orden ${invoice} marcada como pagada.`,
      });
      router.replace("/");
    }
  }, [searchParams, updateOrderStatus, router]);

  // Refresh balance once address is available (handles fresh-page-load race condition)
  useEffect(() => {
    if (!awaitingBalanceRefresh || !address) return;
    refreshBalance();
    setAwaitingBalanceRefresh(false);
  }, [awaitingBalanceRefresh, address, refreshBalance]);

  const activeProducts = products.filter((p) => p.isActive && p.stock > 0);

  return (
    <PageContainer className="relative">
      {/* Ambient glow — Premium touch */}
      <div
        className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{
          background: "color-mix(in srgb, var(--primary) 15%, transparent)",
        }}
      />

      <div className="relative flex flex-col gap-12 pt-8">
        {/* Hero Section */}
        <div className="flex flex-col gap-4 text-center md:text-left max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-foreground">
            Nuestra <span className="text-primary">selección</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl line-clamp-1">
            Compra productos exclusivos con <span className="text-primary font-bold">EuroToken</span> de forma rápida y segura.
          </p>
        </div>

        {/* Grid Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[400px] bg-muted/40 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeProducts.map((product) => (
              <ProductCardItem key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && activeProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
             <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mb-6 text-muted-foreground/30 rotate-12">
               <Package className="w-10 h-10" />
             </div>
            <h2 className="text-2xl font-extrabold tracking-tighter text-foreground mb-2">
              No hay productos disponibles
            </h2>
            <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
              Estamos actualizando nuestro catálogo. Vuelve pronto para descubrir nuestras novedades.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
