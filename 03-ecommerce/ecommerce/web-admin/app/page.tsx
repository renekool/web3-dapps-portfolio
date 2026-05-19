"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/modern-ui/button";
import { Badge } from "@/components/modern-ui/badge";
import { Card, CardContent } from "@/components/modern-ui/card";
import { 
  Wallet, 
  ArrowRight, 
  Shield, 
  CheckCircle2, 
  Building2, 
  Package, 
  FileText, 
  Users 
} from "lucide-react";
import { useWallet } from "@/lib/web3/WalletContext";
import { ConnectDialog } from "../components/ConnectDialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Pillar {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const PILLARS: Pillar[] = [
  {
    icon: Building2,
    title: "Empresas",
    description: "Gestión centralizada de compañías registradas, validación de estados y activación de nodos.",
  },
  {
    icon: Package,
    title: "Productos",
    description: "Control de inventario, actualización de precios y monitoreo de stock en tiempo real.",
  },
  {
    icon: FileText,
    title: "Facturas",
    description: "Seguimiento de transacciones, estados de pago y generación de reportes financieros.",
  },
  {
    icon: Users,
    title: "Clientes",
    description: "Visualización de perfiles, historial de compras y segmentación de usuarios del ecosistema.",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, label: "Conexión segura" },
  { icon: CheckCircle2, label: "Plataforma verificada" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [showConnect, setShowConnect] = useState(false);
  const { isLoading, isConnected, role, connect } = useWallet();
  const isConnecting = isLoading;

  const handleOpenConnect = () => {
    setShowConnect(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Nav onConnect={handleOpenConnect} isConnecting={isConnecting} />
      
      <main className="flex-1 flex flex-col items-center">
        <HeroSection onConnect={handleOpenConnect} isConnecting={isConnecting} />
        <GestionIntegralSection />
      </main>

      <Footer />

      <ConnectDialog 
        open={showConnect} 
        onOpenChange={setShowConnect} 
      />
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav({ onConnect, isConnecting }: { onConnect: () => void; isConnecting: boolean }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="flex justify-between items-center h-[72px] px-8 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-sans)]">
          <span className="text-primary">Viva</span><span className="text-[#000000]">Pay</span> <span className="text-primary">Admin</span>
        </span>

        <Button 
          onClick={onConnect}
          disabled={isConnecting}
          size="sm" 
          className="rounded-full px-5 transition-all"
        >
          {isConnecting ? (
            "Conectando..."
          ) : (
            <>
              <span className="hidden sm:inline">Conectar billetera</span>
              <span className="sm:hidden">Conectar</span>
            </>
          )}
        </Button>

      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ onConnect, isConnecting }: { onConnect: () => void; isConnecting: boolean }) {
  return (
    <section className="relative w-full flex items-center justify-center min-h-screen px-6 pt-[72px]">
      {/* Ambient glow — subtle, as per web-landing */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: "color-mix(in srgb, var(--primary) 5%, transparent)",
        }}
      />

      <div className="relative w-full max-w-4xl text-center space-y-10 py-20">
        {/* Product pill */}
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-full text-muted-foreground"
          >
            Ecosistema B2B · v1.0
          </Badge>
        </div>

        {/* Headline */}
        <div className="space-y-5">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-foreground font-[family-name:var(--font-sans)]">
            <span className="block whitespace-nowrap">Panel de Administración</span>
            <span className="block whitespace-nowrap text-primary">Control total del ecosistema</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            Gestión integral de <span className="text-foreground font-semibold">empresas, productos y facturas</span>
            <br />
            del ecosistema en tiempo real
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex justify-center">
          <Button
            onClick={onConnect}
            disabled={isConnecting}
            size="lg"
            className="h-14 px-10 rounded-2xl text-base font-bold gap-3 transition-all"
            style={{
              boxShadow: "0 8px 32px -8px color-mix(in srgb, var(--primary) 40%, transparent)",
            }}
          >
            <Wallet className="w-5 h-5" />
            {isConnecting ? "Conectando..." : "Conectar billetera"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="flex justify-center items-center gap-7 pt-1">
          {TRUST_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
            >
              <item.icon className="w-3.5 h-3.5 text-success" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gestión Integral (How It Works equivalent) ─────────────────────────────

function GestionIntegralSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 pb-32">
      <div className="text-center mb-12 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Módulos
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-[family-name:var(--font-sans)]">
          Gestión Integral
        </h2>
        <p className="text-base text-muted-foreground max-w-xs mx-auto">
          Cuatro pilares para el control total de tu operación B2B.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PILLARS.map((pillar, i) => (
          <PillarCard key={i} pillar={pillar} index={i} />
        ))}
      </div>
    </section>
  );
}

function PillarCard({ pillar, index }: { pillar: Pillar; index: number }) {
  return (
    <Card variant="default" className="group">
      <CardContent className="pt-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <pillar.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-4xl font-extrabold text-border/50 font-[family-name:var(--font-sans)] tabular-nums select-none">
              0{index + 1}
            </span>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground font-[family-name:var(--font-sans)]">
              {pillar.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {pillar.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border/20 py-6 px-8 w-full">
      <div className="max-w-6xl mx-auto flex justify-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 font-[family-name:var(--font-sans)]">
          © 2024 <span className="text-primary">Viva</span><span className="text-[#000000]">Pay</span> <span className="text-primary">Admin</span>
        </p>
      </div>
    </footer>
  );
}
