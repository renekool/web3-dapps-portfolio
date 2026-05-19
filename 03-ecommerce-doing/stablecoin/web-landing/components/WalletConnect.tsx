'use client';

import { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react';

interface WalletConnectProps {
  onAddressChange: (address: string | null) => void;
}

export default function WalletConnect({ onAddressChange }: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            handleAccountsChanged(accounts);
          }
        });

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAddress(null);
      onAddressChange(null);
    } else {
      setAddress(accounts[0]);
      onAddressChange(accounts[0]);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Por favor instala MetaMask');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts);
      
      // Verificar red Anvil
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x7a69') { // 31337
        setError('Por favor conéctate a la red Anvil (Localhost 8545)');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="w-full">
      {!address ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          {isConnecting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wallet className="w-5 h-5" />
          )}
          {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
        </button>
      ) : (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Wallet Conectada</p>
              <p className="text-sm font-mono text-white">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {}} // MetaMask handle disconnection
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Cambiar
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Global declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}
