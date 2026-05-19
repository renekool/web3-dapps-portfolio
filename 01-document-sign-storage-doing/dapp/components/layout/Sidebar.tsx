"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileSignature,
  PanelLeftClose,
  ChevronRight,
  UploadCloud,
  ShieldCheck,
  History,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useWeb3 } from "../../hooks/useWeb3";

export function Sidebar() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Navigation is only allowed if connected AND on the correct network (Sepolia)
  const { isConnected, isSepolia } = useWeb3();
  const isReady = isConnected && isSepolia;

  const navItems = [
    {
      label: "Upload & Sign",
      icon: UploadCloud,
      path: "/upload",
      isActive: pathname === "/upload",
    },
    {
      label: "Verify",
      icon: ShieldCheck,
      path: "/verify",
      isActive: pathname === "/verify",
    },
    {
      label: "History",
      icon: History,
      path: "/history",
      isActive: pathname === "/history",
    },
  ];

  return (
    <aside
      className={`${
        isSidebarCollapsed ? "w-20" : "w-64"
      } border-r border-slate-300 dark:border-slate-800/60 flex flex-col bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out z-40 relative shadow-sm shrink-0`}
    >
      <div
        className={`flex h-[76px] items-center ${
          isSidebarCollapsed ? "justify-center px-0" : "justify-between px-6"
        } transition-all duration-300`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <FileSignature size={24} strokeWidth={2.5} />
          </div>
          <div
            className={`${
              isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            } transition-all duration-300`}
          >
            <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white tracking-tight">
              Truxign
            </h1>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-400 mt-1">
              Trust Sign
            </p>
          </div>
        </div>

        {!isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
          >
            <PanelLeftClose size={20} />
          </button>
        )}
      </div>

      {/* Collapsed Toggle (when sidebar is closed) */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="absolute top-6 right-[-12px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full p-1 text-slate-600 hover:text-primary dark:text-slate-400 transition-colors shadow-sm z-50 flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <div className="flex flex-1 flex-col justify-between px-3 py-6">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (isReady) {
                  router.push(item.path);
                }
              }}
              disabled={!isReady}
              className={`group flex items-center ${
                isSidebarCollapsed ? "justify-center px-0 gap-0" : "px-4 gap-4"
              } rounded-xl py-3.5 transition-all duration-200 relative w-full text-left cursor-pointer ${
                !isReady
                  ? "opacity-40 grayscale pointer-events-none text-slate-400 cursor-not-allowed"
                  : item.isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-primary/10 dark:text-white font-bold shadow-sm ring-1 ring-slate-200 dark:ring-0"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white font-medium"
              }`}
            >
              <item.icon
                size={24}
                className={`shrink-0 ${item.isActive && isReady ? "text-primary dark:text-white" : ""}`}
              />
              <span
                className={`text-sm tracking-wide whitespace-nowrap transition-all duration-300 ${
                  isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                }`}
              >
                {item.label}
              </span>
              {isSidebarCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-black text-white text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div
          className={`mt-auto transition-all duration-300 ${
            isSidebarCollapsed ? "px-0 flex justify-center" : "px-0"
          }`}
        >
          <ThemeToggle isSidebarCollapsed={isSidebarCollapsed} />
        </div>
      </div>
    </aside>
  );
}
