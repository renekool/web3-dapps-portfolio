import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "VivaPay — Ecommerce con EuroToken",
  description: "Comprá productos reales y pagá con euros digitales de forma segura y sin bancos.",
};

import { WalletProvider } from "@/lib/web3/WalletContext";
import { SessionProvider } from "@/lib/web3/SessionContext";
import { AppShell } from "@/components/modern-ui/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SessionProvider>
          <WalletProvider>
            <AppShell>
              {children}
            </AppShell>
          </WalletProvider>
        </SessionProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
