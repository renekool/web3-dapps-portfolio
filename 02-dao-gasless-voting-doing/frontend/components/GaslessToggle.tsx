'use client'

import React from 'react';
import { useGaslessPreference } from '@/context/GaslessContext';
import { Fuel, ShieldAlert, Loader2 } from 'lucide-react';
import { useDAOStore } from '@/lib/store/useDAOStore';

export function GaslessToggle() {
  const {
    userPreferenceGasless: gasless,
    setUserPreferenceGasless: setGasless,
    relayerStatus,
    isGaslessEnabled
  } = useGaslessPreference();

  const { isInitializing } = useDAOStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Debug - verificar el valor real
  // console.log('[GaslessToggle] RENDER - gasless:', gasless, 'relayerStatus:', relayerStatus, 'isGaslessEnabled:', isGaslessEnabled);

  // Prevenir Hydration Mismatch: el primer render debe coincidir con el servidor
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-full px-2 shadow-sm shrink-0 h-[40px] w-[172px]">
        <div className="flex items-center justify-center shrink-0 w-[24px] h-[24px]">
          <Loader2 className="size-4 text-slate-400 animate-spin" />
        </div>
        <div className="flex flex-col flex-1 h-full justify-center">
          <span className="text-[13px] font-bold leading-none whitespace-nowrap text-slate-500">
            Checking...
          </span>
        </div>
        <div className="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent bg-slate-200">
          <span className="inline-block h-4 w-4 rounded-full bg-white shadow" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-full px-2 shadow-sm hover:shadow-md transition-all shrink-0 h-[40px] w-[172px]">
      
      {/* Icono de Estado */}
      <div className="flex items-center justify-center shrink-0 w-[24px] h-[24px]">
        {relayerStatus === 'checking' || isInitializing ? (
          <Loader2 className="size-4 text-slate-400 animate-spin" />
        ) : isGaslessEnabled ? (
          <Fuel className="size-4 text-emerald-500" />
        ) : (
          <ShieldAlert className="size-4 text-slate-400" />
        )}
      </div>

      {/* TEXTO: Sincronizado con la capacidad real del sistema */}
      <div className="flex flex-col flex-1 h-full justify-center relative">
        <span
          className={`text-[13px] font-bold leading-none whitespace-nowrap ${isGaslessEnabled ? 'text-emerald-700' : 'text-slate-500'}`}
        >
          {relayerStatus === 'checking' ? 'Checking...' : isGaslessEnabled ? 'Gasless ON' : 'Direct mode'}
        </span>
        
        {/* Warning informativo */}
        <div className="absolute left-0 -bottom-[2px]">
          {relayerStatus === 'unavailable' && gasless && !isInitializing && (
            <span className="text-[8px] leading-none text-red-500 font-bold uppercase tracking-tight">Relayer Unavailable</span>
          )}
        </div>
      </div>

      {/* Switch: Refleja únicamente gasless */}
      <button
        onClick={() => {
          console.log('[GaslessToggle] CLICK - toggling from', gasless, 'to', !gasless);
          setGasless(!gasless);
        }}
        disabled={isInitializing}
        title={relayerStatus === 'unavailable' ? 'Gasless currently unavailable' : 'Toggle Gasless'}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${gasless ? 'bg-emerald-500' : 'bg-slate-200'} ${isInitializing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${gasless ? 'translate-x-[1rem]' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
