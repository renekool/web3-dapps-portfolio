"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/modern-ui/button";
import { Badge } from "@/components/modern-ui/badge";
import { Card, CardContent } from "@/components/modern-ui/card";
import { Wallet, LogOut, Copy, Check, ChevronDown, CheckCircle2, Zap, ArrowRight, Info, RefreshCw, Shield, Euro, ShoppingBag } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { useWallet } from "@/lib/web3/WalletContext";
import CompraActivoPage from "./compra/page";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    icon: Wallet,
    title: "Conecta tu billetera",
    description:
      "Vincula MetaMask u otra billetera compatible en un clic. Sin formularios ni registro previo.",
  },
  {
    icon: Euro,
    title: "Carga euros en tu billetera",
    description:
      "Ingresa el monto que quieres cargar. Pagás con tarjeta y recibís EuroToken al instante.",
  },
  {
    icon: Zap,
    title: "Comprá en la tienda",
    description:
      "Usá tu saldo en EuroToken para pagar productos dentro del ecosistema. Rápido y sin comisiones ocultas.",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, label: "Conexión segura" },
  { icon: CheckCircle2, label: "Plataforma verificada" },
];



// --- Page ────────────────────────────────────────────────────────────────────

export default function UniversalPage() {
  const { status } = useWallet();
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || "landing";
  const isPurchase = appMode === "purchase";

  if (isPurchase) {
    return <CompraActivoPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {status === "no-wallet" && <NoWalletOverlay />}
      <Nav />
      <main className="flex-1 flex flex-col items-center">
        <HeroSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const router = useRouter();
  const { connectWallet, status } = useWallet();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="flex justify-between items-center h-[72px] px-8 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-sans)]">
          <span className="text-primary">Viva</span><span className="text-[#000000]">Pay</span>
        </span>

        <Button 
          onClick={status === "connected" ? () => router.push("/compra") : connectWallet} 
          disabled={status === "connecting"}
          size="sm" 
          className="rounded-full px-5 transition-all"
        >
          {status === "connecting" ? (
            "Conectando..."
          ) : status === "connected" ? (
            "Ir a la Compra"
          ) : (
            "Conectar billetera"
          )}
        </Button>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const router = useRouter();
  const { connectWallet, status } = useWallet();
  return (
    <section className="relative w-full flex items-center justify-center min-h-screen px-6 pt-[72px]">
      {/* Ambient glow — subtle, not decorative */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[160px] pointer-events-none"
        style={{
          background:
            "color-mix(in srgb, var(--primary) 5%, transparent)",
        }}
      />

      <div className="relative w-full max-w-4xl text-center space-y-10 py-20">
        {/* Product pill */}
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-full text-muted-foreground"
          >
            EuroToken · EURT
          </Badge>
        </div>

        {/* Headline — one clear statement */}
        <div className="space-y-5">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-foreground font-[family-name:var(--font-sans)]">
            <span className="block whitespace-nowrap">Tu tienda en euros digitales</span>
            <span className="block whitespace-nowrap text-primary">Comprá y pagá sin bancos</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            Elegí tus productos y pagá con <span className="text-foreground font-semibold">EuroToken</span>
            <br />
            Sin bancos, sin esperas y 100% seguro
          </p>
        </div>

        {/* CTAs */}
        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            onClick={status === "connected" ? () => router.push("/compra") : connectWallet}
            disabled={status === "connecting"}
            size="lg"
            className="h-14 px-10 rounded-2xl text-base font-bold gap-3 transition-all"
            style={{
              boxShadow:
                "0 8px 32px -8px color-mix(in srgb, var(--primary) 40%, transparent)",
            }}
          >
            <Wallet className="w-5 h-5" />
            {status === "connecting" ? (
              "Conectando..."
            ) : status === "connected" ? (
              "Ir a la Compra"
            ) : (
              "Conectar billetera"
            )}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <a href="http://localhost:7004" style={{ textDecoration: "none" }}>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 rounded-2xl text-base font-bold gap-3"
            >
              <ShoppingBag className="w-5 h-5" />
              Tienda online
            </Button>
          </a>
        </div>

        {/* Trust indicators — minimal */}
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

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 pb-32">
      <div className="text-center mb-12 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Proceso
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-[family-name:var(--font-sans)]">
          Así funciona
        </h2>
        <p className="text-base text-muted-foreground max-w-xs mx-auto">
          Tres pasos para cargar tu billetera y empezar a comprar.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {STEPS.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <Card variant="default" className="group">
      <CardContent className="pt-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-4xl font-extrabold text-border/50 font-[family-name:var(--font-sans)] tabular-nums select-none">
              0{index + 1}
            </span>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground font-[family-name:var(--font-sans)]">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
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
    <footer className="border-t border-border/20 py-6 px-8">
      <div className="max-w-6xl mx-auto flex justify-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 font-[family-name:var(--font-sans)]">
          © 2024 <span className="text-primary">Viva</span><span className="text-[#000000]">Pay</span>
        </p>
      </div>
    </footer>
  );
}

// ─── Overlays ────────────────────────────────────────────────────────────────

function NoWalletOverlay() {
  const { resetStatus } = useWallet();
  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
      <div className="max-w-md p-8 rounded-3xl bg-card border border-border shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3 font-[family-name:var(--font-sans)]">MetaMask es necesario</h2>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Para operar en <span className="text-primary">Viva</span><span className="text-[#000000]">Pay</span> necesitas una billetera Web3 instalada.
          Por favor, instala la extensión de MetaMask para continuar.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full h-12 rounded-xl text-base font-bold">
            <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
              Instalar MetaMask
            </a>
          </Button>
          <Button 
            variant="ghost" 
            onClick={resetStatus}
            className="w-full h-10 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
