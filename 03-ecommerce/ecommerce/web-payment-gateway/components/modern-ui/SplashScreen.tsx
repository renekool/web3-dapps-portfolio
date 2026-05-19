"use client";

import React from "react";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-2xl">
      <div className="relative flex flex-col items-center">
        {/* Animated Glow behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative mb-8 text-4xl font-extrabold tracking-tighter font-[family-name:var(--font-sans)] animate-bounce-slow">
          <span className="text-[#8B3A2A]">Viva</span><span className="text-[#000000]">Pay</span> <span className="text-[#8B3A2A]">Admin</span>
        </div>
        
        {/* Elegant Loading Bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="w-full h-full bg-primary origin-left animate-loading-bar" />
        </div>
        
        <p className="mt-6 text-sm font-medium text-muted-foreground/60 tracking-widest uppercase">
          Sincronizando seguridad
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes loading-bar {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-loading-bar {
          animation: loading-bar 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  );
}
