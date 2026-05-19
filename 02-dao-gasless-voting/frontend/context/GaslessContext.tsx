'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

type RelayerStatus = 'checking' | 'available' | 'unavailable';

type GaslessContextType = {
  userPreferenceGasless: boolean;
  setUserPreferenceGasless: (enabled: boolean) => void;
  relayerStatus: RelayerStatus;
  isGaslessEnabled: boolean;
  isHydrated: boolean;
};

const GaslessContext = createContext<GaslessContextType | undefined>(undefined);

export function GaslessProvider({ children }: { children: React.ReactNode }) {
  // FUENTE DE VERDAD SINCRÓNICA: Lee localStorage INMEDIATAMENTE antes del primer render en el cliente.
  // Esto garantiza que el ON/OFF sea el correcto desde el milisegundo 0.
  const [gasless, setGasless] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('gaslessEnabled');
    return stored === 'true';
  });

  const [relayerStatus, setRelayerStatus] = useState<RelayerStatus>('checking');

  // Solo chequea el relayer asincrónicamente
  useEffect(() => {
    const checkRelayer = async () => {
      try {
        const res = await fetch('/api/relay/status');
        if (!res.ok) throw new Error('Relayer status check failed');
        const data = await res.json();
        setRelayerStatus(data.status === 'available' ? 'available' : 'unavailable');
      } catch (err) {
        setRelayerStatus('unavailable');
      }
    };
    checkRelayer();
  }, []);

  const updatePreference = (value: boolean) => {
    localStorage.setItem('gaslessEnabled', value.toString());
    setGasless(value);
  };

  const isGaslessEnabled = gasless && relayerStatus === 'available';

  return (
    <GaslessContext.Provider value={{
      userPreferenceGasless: gasless,
      setUserPreferenceGasless: updatePreference,
      relayerStatus,
      isGaslessEnabled,
      isHydrated: true
    }}>
      {children}
    </GaslessContext.Provider>
  );
}

export const useGaslessPreference = () => {
  const context = useContext(GaslessContext);
  if (context === undefined) {
    throw new Error('useGaslessPreference must be used within a GaslessProvider');
  }
  return context;
};
