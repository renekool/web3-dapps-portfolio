import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/web3/WalletContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { OrdersProvider } from "@/lib/contexts/OrdersContext";
import { ClientShell } from "@/components/ClientShell";
import { SonnerGlobal } from "@/components/modern-ui/sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VivaPay Shop",
  description: "Tienda online con pagos en EuroToken",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <WalletProvider>
          <CartProvider>
            <OrdersProvider>
              <ClientShell>{children}</ClientShell>
              <SonnerGlobal />
            </OrdersProvider>
          </CartProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
