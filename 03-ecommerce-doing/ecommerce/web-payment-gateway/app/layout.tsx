import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/web3/WalletContext";
import { Toaster } from "@/components/modern-ui/sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Pasarela de Pago | VivaPay",
  description: "Pasarela de pago descentralizada EuroToken",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <body className={`${plusJakarta.variable} ${inter.variable}`} suppressHydrationWarning={true}>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
        {/* Force CSS reload */}
      </body>
    </html>
  );
}
