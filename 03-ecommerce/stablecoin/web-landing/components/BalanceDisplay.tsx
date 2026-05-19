'use client';

import { useState, useEffect } from 'react';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { RefreshCcw } from 'lucide-react';

interface BalanceDisplayProps {
  address: string | null;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const ABI = ['function balanceOf(address) view returns (uint256)'];

export default function BalanceDisplay({ address }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<string>('0.0000');
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
      const rawBalance = await contract.balanceOf(address);
      setBalance(Number(formatUnits(rawBalance, 6)).toFixed(4));
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  return (
    <div className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm text-gray-400 font-medium">Balance disponible</p>
        <button 
          onClick={fetchBalance}
          disabled={!address || isLoading}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
        >
          <RefreshCcw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-white tracking-tight">
          {address ? balance : '0.0000'}
        </h3>
        <span className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          EURT
        </span>
      </div>
      {!address && (
          <p className="mt-2 text-xs text-gray-500 italic">Conecta tu wallet para ver el saldo</p>
      )}
    </div>
  );
}
