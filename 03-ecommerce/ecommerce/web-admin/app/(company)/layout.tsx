"use client";

import { useRouter } from "next/navigation";
import { Lock, Home, ArrowRight } from "lucide-react";
import { useWallet } from "@/lib/web3/WalletContext";
import { AppHeader } from "@/components/AppHeader";
import { CompanyInfoCard } from "@/components/CompanyInfoCard";
import { CompanyTabs } from "@/components/CompanyTabs";
import { Button } from "@/components/modern-ui/button";
import { Card, CardContent } from "@/components/modern-ui/card";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role, isHydrating, isDisconnecting } = useWallet();

  if (isHydrating || isDisconnecting) return null;

  if (role !== "company") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6] p-6">
        <Card className="max-w-md w-full bg-white border-primary/10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden">
          <CardContent className="pt-12 pb-10 text-center space-y-8 px-10">
            <div className="w-20 h-20 bg-primary/5 rounded-[24px] flex items-center justify-center mx-auto mb-2 border border-primary/10">
              <Lock className="w-10 h-10 text-primary/80" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Acceso Denegado</h2>
              <p className="text-muted-foreground text-[16px] leading-relaxed">
                Esta sección está reservada para empresas registradas. Por favor, conéctate con el rol de Empresa.
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="w-full max-w-[280px] mx-auto bg-primary hover:bg-primary/90 text-white rounded-[16px] h-14 text-base font-bold flex items-center px-6 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                <span>Volver a la Landing</span>
              </div>
              <div className="flex-1" />
              <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 pt-[80px] pb-24">
        <div className="space-y-6 pt-4">
          <CompanyInfoCard />
          <CompanyTabs />
          {children}
        </div>
      </div>
    </div>
  );
}
