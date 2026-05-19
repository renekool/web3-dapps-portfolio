"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/modern-ui/dialog";
import { Button } from "@/components/modern-ui/button";
import { ShieldCheck, Building2, ArrowRight, Loader2, Wallet, X, AlertTriangle, Info } from "lucide-react";
import { useWallet } from "@/lib/web3/WalletContext";
import { toast } from "sonner";

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function RoleCard({ icon, title, subtitle, description, selected, onClick }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-[14px]"
    >
      <div
        className={`
          relative h-full rounded-[14px] border-2 p-5 transition-all duration-200
          flex flex-col gap-3
          ${selected
            ? "border-primary bg-primary/[0.04] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)]"
            : "border-border/30 bg-white hover:border-border/55 hover:bg-white shadow-none"
          }
        `}
      >
        {/* Top: icon + title/subtitle */}
        <div className="flex items-center gap-3">
          <div
            className={`
              w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0 transition-colors duration-200
              ${selected ? "bg-primary text-white" : "bg-muted/70 text-muted-foreground"}
            `}
          >
            {icon}
          </div>
          <div className="flex flex-col leading-tight">
            <span
              className={`text-[14px] font-bold transition-colors duration-200 ${selected ? "text-primary" : "text-foreground"}`}
            >
              {title}
            </span>
            <span className="text-[11px] text-muted-foreground/70 font-normal">{subtitle}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[12px] text-muted-foreground/80 leading-relaxed pr-7">
          {description}
        </p>

        {/* Radio indicator — bottom right */}
        <div className="absolute bottom-[14px] right-[14px]">
          <div
            className={`
              w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-200
              ${selected ? "border-primary bg-primary" : "border-muted-foreground/25 bg-transparent"}
            `}
          >
            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── ConnectDialog ────────────────────────────────────────────────────────────

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectDialog({ open, onOpenChange }: ConnectDialogProps) {
  const router = useRouter();
  const { connect, isLoading, isConnected } = useWallet();
  const isConnecting = isLoading;
  const [selectedRole, setSelectedRole] = useState<"owner" | "company" | null>(null);
  const [errorType, setErrorType] = useState<"NONE" | "NO_COMPANY" | "NOT_OWNER" | "GENERIC">("NONE");

  const handleConnect = async () => {
    if (!selectedRole) return;
    try {
      const normalizedSelected = selectedRole === "owner" ? "owner" : "company";
      await connect(normalizedSelected);
      onOpenChange(false);
      
      if (selectedRole === "owner") {
        toast.success("Acceso: Panel de Administrador");
        router.push("/companies");
      } else {
        toast.success("Acceso: Panel de Gestión de Empresa");
        router.push("/products");
      }
    } catch (e: any) {
      if (e.message !== "NO_COMPANY" && e.message !== "NOT_OWNER") {
        console.error("Wallet connection caught an unexpected error:", e);
      }
      if (e.message === "NO_COMPANY") {
        setErrorType("NO_COMPANY");
      } else if (e.message === "NOT_OWNER") {
        setErrorType("NOT_OWNER");
      } else {
        setErrorType("GENERIC");
      }
      // do not close the dialog on error, instead show error content inside it
    }
  };

  if (errorType !== "NONE") {
    return (
      <Dialog open={open} onOpenChange={(val) => {
        if (!val) setErrorType("NONE");
        onOpenChange(val);
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex justify-center mb-2 mt-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <DialogHeader className="text-center sm:text-center mt-2">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {errorType === "NOT_OWNER" ? "Acceso Denegado" : errorType === "NO_COMPANY" ? "Empresa No Encontrada" : "Error de Conexión"}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {errorType === "NOT_OWNER" 
                ? "La billetera conectada no tiene permisos de Administrador."
                : errorType === "NO_COMPANY"
                ? "No hay una empresa vinculada a esta billetera."
                : "Ocurrió un problema al validar tu perfil de acceso."}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
            <p className="text-sm text-destructive font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              {errorType === "NOT_OWNER"
                ? "Debes usar la billetera del creador (Owner)."
                : errorType === "NO_COMPANY"
                ? "Debes crear una empresa antes de ingresar."
                : "Por favor, inténtalo de nuevo."}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2 mt-2 mb-4">
            <Button 
              className="w-full h-12 text-base font-bold bg-destructive hover:bg-destructive/90 text-white rounded-2xl"
              onClick={() => {
                setErrorType("NONE");
                onOpenChange(false);
              }}
            >
              Cerrar
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-10 text-sm font-medium text-muted-foreground"
              onClick={() => setErrorType("NONE")}
            >
              Intentar con otra billetera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setErrorType("NONE");
      onOpenChange(val);
    }}>
      <DialogContent
        hideClose
        className="max-w-[560px] p-0 overflow-hidden border-none shadow-2xl rounded-[20px] bg-background"
      >
        {/* Close */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-[18px] right-[18px] w-8 h-8 rounded-lg border border-border/10 bg-background flex items-center justify-center hover:bg-muted/30 transition-colors z-10"
        >
          <X className="w-4 h-4 text-muted-foreground/40" />
        </button>

        <div className="pt-8 px-7 pb-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-[18px]">
            <div className="w-14 h-14 rounded-[14px] bg-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-7 h-7 text-primary/80" />
            </div>
            <div>
              <DialogTitle className="text-[22px] font-bold tracking-tight text-foreground leading-tight">
                Simular Conexión
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground mt-0.5 leading-snug">
                Selecciona tu perfil de acceso para entrar al panel de administración.
              </DialogDescription>
            </div>
          </div>

          {/* Cards */}
          <div className="flex flex-row gap-3">
            <RoleCard
              icon={<ShieldCheck className="w-[22px] h-[22px]" />}
              title="Administrador"
              subtitle="(Owner)"
              description="Acceso total: gestión de empresas y nodos."
              selected={selectedRole === "owner"}
              onClick={() => setSelectedRole("owner")}
            />
            <RoleCard
              icon={<Building2 className="w-[22px] h-[22px]" />}
              title="Empresa"
              subtitle="(Company)"
              description="Gestión de productos, stock y facturación."
              selected={selectedRole === "company"}
              onClick={() => setSelectedRole("company")}
            />
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleConnect}
              disabled={!selectedRole || isConnecting}
              className="w-full h-[52px] rounded-[12px] text-[15px] font-semibold gap-2.5 transition-all duration-200 shadow-lg shadow-primary/10 hover:shadow-primary/25 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  Entrar al Panel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Footer */}
            <div className="flex items-center justify-center gap-1.5 opacity-40">
              <ShieldCheck className="w-[13px] h-[13px] text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Entorno de pruebas · <span className="text-[#8B3A2A]">Viva</span><span className="text-[#000000]">Pay</span> Mock Mode
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
