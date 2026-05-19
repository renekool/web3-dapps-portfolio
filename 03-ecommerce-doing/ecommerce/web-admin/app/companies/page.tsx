"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/modern-ui/button";
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
import { Input } from "@/components/modern-ui/input";
import { Textarea } from "@/components/modern-ui/textarea";
import { Label } from "@/components/modern-ui/label";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Shield,
  ArrowRight,
  Home,
  Lock,
  Edit3,
  Wand2,
  Loader2
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/modern-ui/tooltip";
import { WalletAddress } from "@/components/modern-ui/WalletAddress";
import { AppHeader } from "@/components/AppHeader";
import { PageContainer } from "@/components/PageContainer";
import { EmptyState } from "@/components/EmptyState";
import { useRouter } from "next/navigation";
import { EntityCard } from "@/components/modern-ui/EntityCard";
import { useWallet } from "@/lib/web3/WalletContext";
import { getEcommerceContract, getHttpProvider } from "@/lib/web3/contract";
import { ethers } from "ethers";

export interface Company {
  id: number;
  name: string;
  address: string;
  description?: string;
  isActive: boolean;
  registeredAt: string;
}

function formatEURT(amount: bigint): string {
  return ethers.formatUnits(amount, 18);
}

const MOCK_SIMULATION_DATA = [
  { name: "AgroTech Vanguardia", description: "Implementación de sensores IoT para el monitoreo de humedad en cultivos y automatización de riego." },
  { name: "EcoLogistics Global", description: "Plataforma de trazabilidad de carbono para cadenas de suministro logístico de exportación." },
  { name: "Solaris Energías", description: "Instalación de paneles solares y micro-redes inteligentes para comunidades rurales." },
  { name: "BioGenética Avanzada", description: "Investigación y desarrollo de semillas resistentes a sequías extremas y plagas comunes." },
  { name: "TerraFarms Orgánicos", description: "Producción a gran escala de vegetales orgánicos certificados para mercados locales e internacionales." },
  { name: "AquaPure Solutions", description: "Sistemas avanzados de desalinización y purificación de agua con energía renovable." },
  { name: "InnovaCrops SA", description: "Uso de drones y análisis multiespectral para la agricultura de precisión y optimización de recursos." },
  { name: "VerdeCiudad Constructora", description: "Desarrollo de edificios autosustentables con integración de jardines verticales e hidroponía urbana." },
  { name: "NutriAnimal Feeds", description: "Fabricación de alimentos balanceados para ganadería con aditivos que reducen las emisiones de metano." },
  { name: "SmartForestry", description: "Monitoreo satelital y gestión sostenible de bosques maderables para certificación FSC." },
  { name: "Café Origen Premium", description: "Cultivo y procesamiento de granos de café de especialidad bajo sombra en ecosistemas protegidos." },
  { name: "AgriDrone Services", description: "Servicios de fumigación y monitoreo aéreo automatizado para cultivos extensivos." },
  { name: "OceanHarvest Acuicultura", description: "Cultivo responsable de macroalgas y moluscos para consumo humano y uso cosmético." },
  { name: "BioFertilizantes del Sur", description: "Producción de abonos líquidos y sólidos a partir de compostaje de residuos orgánicos urbanos." },
  { name: "EcoPlastics Biotech", description: "Desarrollo de bioplásticos compostables a partir de almidón de maíz y subproductos agrícolas." },
  { name: "SolarAgri Pumps", description: "Sistemas de bombeo de agua impulsados por energía solar fotovoltaica para zonas aisladas." },
  { name: "AgroMarket Digital", description: "Marketplace B2B que conecta a pequeños productores agrícolas directamente con grandes compradores." },
  { name: "GreenVet Salud Animal", description: "Servicios veterinarios y desarrollo de vacunas orgánicas para animales de granja." },
  { name: "FloraTech Hidroponía", description: "Sistemas de cultivo hidropónico de alta densidad y clima controlado para entornos urbanos." },
  { name: "TierraViva Exportaciones", description: "Acopio, empaque y exportación de superalimentos andinos bajo estándares de comercio justo." }
];

const MOCK_ADDRESSES = [
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
  "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
  "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
  "0x976ea74026e726554db657fa54763abd0c3a0aa9",
  "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
  "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
  "0xa0ee7a142d267c1f36714e4a8f75612f20a79720"
];

export default function CompaniesPage() {
  const router = useRouter();
  const { role, address, signer, isHydrating, isDisconnecting } = useWallet();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState({ name: "", address: "", description: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadCompanies = React.useCallback(async () => {
    if (!address) return;
    try {
      const contract = getEcommerceContract(getHttpProvider());
      const count = await contract.companyCount();
      const list: Company[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const c = await contract.getCompanyById(i);
        list.push({
          id: i,
          name: c.name,
          address: c.companyAddress,
          description: c.description || "",
          isActive: c.isActive,
          registeredAt: new Date(Number(c.registeredAt) * 1000).toISOString().split('T')[0]
        });
      }
      setCompanies(list);
    } catch (e) {
      console.error("Error loading companies", e);
    }
  }, [address]);

  React.useEffect(() => {
    if (address && role === "owner") {
      loadCompanies();
    }
  }, [address, role, loadCompanies]);

  if (isHydrating || isDisconnecting) return null;

  // Protección de ruta
  if (role !== "owner") {
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
                Esta sección está reservada para administradores del sistema. Por favor, conéctate con el rol de Owner para gestionar el directorio de empresas.
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

  const handleRegister = async () => {
    if (!signer) {
      console.error("No hay signer disponible para firmar la transacción.");
      return;
    }
    setIsRegistering(true);
    try {
      console.log("Iniciando registro de empresa con datos:", newCompany);
      const contract = getEcommerceContract(signer);
      
      console.log("Enviando transacción a la blockchain...");
      const tx = await contract.registerCompanyByAdmin(newCompany.address, newCompany.name, newCompany.description);
      
      console.log("Transacción enviada. Hash:", tx.hash);
      console.log("Esperando confirmación de la red...");
      const timeoutRegister = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TX_TIMEOUT")), 30_000)
      );
      const receipt = await Promise.race([tx.wait(), timeoutRegister]);
      console.log("¡Transacción confirmada en bloque:", receipt.blockNumber, "!");
      toast.success("Empresa registrada en la blockchain");
      await loadCompanies();
      setShowRegister(false);
      setNewCompany({ name: "", address: "", description: "" });
    } catch (e: any) {
      console.error("Error detallado al registrar empresa:", e);
      if (e?.message === "TX_TIMEOUT") {
        toast.error("La transacción está tardando más de lo esperado. Verifica tu wallet.");
      } else {
        if (e.reason) console.error("Razón del contrato:", e.reason);
        toast.error("Error al registrar empresa. Revisa la consola para más detalles.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCompany || !signer) return;
    setIsRegistering(true);
    try {
      console.log("Iniciando actualización de empresa:", editingCompany);
      const contract = getEcommerceContract(signer);
      
      console.log("Enviando transacción de actualización...");
      const tx = await contract.updateCompany(editingCompany.id, editingCompany.address, editingCompany.name, editingCompany.description);
      
      console.log("Transacción enviada. Hash:", tx.hash);
      console.log("Esperando confirmación...");
      const timeoutUpdate = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TX_TIMEOUT")), 30_000)
      );
      const receipt = await Promise.race([tx.wait(), timeoutUpdate]);
      console.log("¡Actualización confirmada en bloque:", receipt.blockNumber, "!");
      toast.success("Datos de empresa actualizados");
      await loadCompanies();
      setEditingCompany(null);
    } catch (e: any) {
      console.error("Error detallado al actualizar empresa:", e);
      if (e?.message === "TX_TIMEOUT") {
        toast.error("La transacción está tardando más de lo esperado. Verifica tu wallet.");
      } else {
        if (e.reason) console.error("Razón del contrato:", e.reason);
        toast.error("Error al actualizar empresa. Revisa la consola.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleStatus = async (id: number) => {
    if (!signer) return;
    try {
      const contract = getEcommerceContract(signer);
      const tx = await contract.toggleCompanyStatus(id);
      console.log("TX enviada:", tx.hash);
      const timeoutToggle = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TX_TIMEOUT")), 30_000)
      );
      await Promise.race([tx.wait(), timeoutToggle]);
      toast.success("Estado de empresa actualizado");
      await loadCompanies();
    } catch (e: any) {
      console.error("Error toggling company status:", e);
      if (e?.message === "TX_TIMEOUT") {
        toast.error("La transacción está tardando más de lo esperado.");
      } else {
        toast.error("Error al cambiar estado");
      }
    }
  };

  const handleSimulate = () => {
    const randomCompany = MOCK_SIMULATION_DATA[Math.floor(Math.random() * MOCK_SIMULATION_DATA.length)];
    const randomAddress = MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];
    
    if (editingCompany) {
      setEditingCompany({ ...editingCompany, name: randomCompany.name, description: randomCompany.description, address: randomAddress });
    } else {
      setNewCompany({ name: randomCompany.name, description: randomCompany.description, address: randomAddress });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <PageContainer>
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-foreground">Gestión de Empresas</h2>
            <p className="text-sm text-muted-foreground mt-1">Control global de entidades registradas en el ecosistema.</p>
          </div>
          <Button onClick={() => setShowRegister(true)} className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Registrar Empresa
          </Button>
        </div>

        {/* Filters/Search */}
        <div className="relative group">
          <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-[40px] py-[12px] h-auto text-[14px] bg-muted/40 border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground"
          />
        </div>

        {/* List Grid / Empty State */}
        {companies.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-9 h-9" />}
            title="Todavía no tienes empresas creadas"
            description="Registra una empresa para comenzar a operar en el ecosistema."
            actionLabel="Registrar Empresa"
            onAction={() => setShowRegister(true)}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {companies.filter(c =>
              c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.address.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((company) => (
              <EntityCard
                key={company.id}
                icon={<Building2 className="w-6 h-6" />}
                title={company.name}
                subtitle={<WalletAddress address={company.address} />}
                mainStat={{
                  label: "REGISTRO",
                  value: company.registeredAt
                }}
                status={{
                  isActive: company.isActive,
                  activeLabel: "ACTIVA",
                  inactiveLabel: "INACTIVA",
                  onToggle: () => toggleStatus(company.id),
                  onEdit: () => setEditingCompany(company)
                }}
              />
            ))}
          </div>
        )}
      </PageContainer>

      {/* Register/Edit Dialog */}
      <Dialog 
        open={showRegister || !!editingCompany} 
        onOpenChange={(open) => {
          if (!open) {
            setShowRegister(false);
            setEditingCompany(null);
          }
        }}
      >
        <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {editingCompany ? "Editar Empresa" : "Nueva Empresa"}
            </DialogTitle>
            <DialogDescription>
              {editingCompany 
                ? "Actualiza los datos de la entidad registrada." 
                : "Registra una nueva entidad en el sistema. Esta acción simula una transacción on-chain."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Comercial</Label>
              <Input 
                id="name" 
                placeholder="Ej. Mi Tienda S.A." 
                value={editingCompany ? (editingCompany.name || "") : newCompany.name}
                onChange={(e) => editingCompany 
                  ? setEditingCompany({ ...editingCompany, name: e.target.value })
                  : setNewCompany({ ...newCompany, name: e.target.value })
                }
                className="px-[14px] py-[12px] h-auto text-[14px] bg-muted/40 border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address (Simulada)</Label>
              <Input 
                id="address" 
                placeholder="0x..." 
                value={editingCompany ? (editingCompany.address || "") : newCompany.address}
                onChange={(e) => editingCompany
                  ? setEditingCompany({ ...editingCompany, address: e.target.value })
                  : setNewCompany({ ...newCompany, address: e.target.value })
                }
                className="px-[14px] py-[12px] h-auto text-[14px] bg-muted/40 border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                placeholder="Descripción de la empresa..." 
                value={editingCompany ? (editingCompany.description || "") : newCompany.description}
                onChange={(e) => editingCompany
                  ? setEditingCompany({ ...editingCompany, description: e.target.value })
                  : setNewCompany({ ...newCompany, description: e.target.value })
                }
                className="px-[14px] py-[12px] text-[14px] bg-muted/40 border-border/40 rounded-xl focus-visible:ring-0 focus-visible:border-primary/40 focus-visible:bg-card transition-all placeholder:text-muted-foreground/40 text-foreground resize-none h-24"
              />
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
              <Button variant="ghost" onClick={() => {
                setShowRegister(false);
                setEditingCompany(null);
              }} disabled={isRegistering}>
                Cancelar
              </Button>
              <Button 
                onClick={editingCompany ? handleUpdate : handleRegister} 
                disabled={isRegistering || (editingCompany ? !editingCompany.name : !newCompany.name)}
                className="gap-2 min-w-[140px]"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editingCompany ? "Guardando..." : "Registrando..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {editingCompany ? "Guardar Cambios" : "Confirmar Registro"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
