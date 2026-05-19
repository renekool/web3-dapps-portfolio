"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, FileText, Users } from "lucide-react";

const TABS = [
  { label: "Productos", href: "/products", icon: Package },
  { label: "Facturas", href: "/invoices", icon: FileText },
  { label: "Clientes", href: "/customers", icon: Users },
];

export function CompanyTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/40">
      <nav className="flex gap-0" aria-label="Módulos de empresa">
        {TABS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px rounded-t-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 ${
                isActive
                  ? "border-primary text-primary bg-primary/[0.04] ring-1 ring-inset ring-primary/20"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
