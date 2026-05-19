'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextType {
  address: string | null;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to avoid stale closure in event handlers without causing effect re-runs
  const providerRef = useRef<ethers.BrowserProvider | null>(null);

  const updateWallet = useCallback(async (browserProvider: ethers.BrowserProvider) => {
    try {
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const network = await browserProvider.getNetwork();

      setSigner(signer);
      setAddress(address);
      setChainId(Number(network.chainId));
    } catch (err) {
      console.error('Error updating wallet:', err);
      setAddress(null);
      setSigner(null);
      setChainId(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);
    providerRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask no está instalado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      providerRef.current = browserProvider;
      setProvider(browserProvider);
      await updateWallet(browserProvider);
    } catch (err: any) {
      console.error('Connection error:', err);
      if (err.code === 4001) {
        setError('Conexión rechazada por el usuario');
      } else {
        setError(err.message || 'Error al conectar la billetera');
      }
    } finally {
      setIsLoading(false);
    }
  }, [updateWallet]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (providerRef.current) {
        updateWallet(providerRef.current);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Silent auto-connect: if MetaMask already has permission, connect without prompting
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        providerRef.current = browserProvider;
        setProvider(browserProvider);
        updateWallet(browserProvider);
      }
    }).catch(console.error);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  // Run once on mount — provider is tracked via ref to avoid re-run loop
  }, [updateWallet, disconnect]);

  return (
    <WalletContext.Provider value={{ 
      address, 
      signer, 
      provider, 
      chainId, 
      connect, 
      disconnect, 
      isLoading, 
      error 
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
