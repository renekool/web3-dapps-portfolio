import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/modern-ui/AppShell";
import { WalletProvider } from "@/lib/web3/WalletContext";
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
  title: "VivaPay Admin",
  description: "Panel de administración del ecosistema Ecommerce",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <WalletProvider>
          <AppShell>{children}</AppShell>
          <SonnerGlobal />
        </WalletProvider>
      </body>
    </html>
  );
}
