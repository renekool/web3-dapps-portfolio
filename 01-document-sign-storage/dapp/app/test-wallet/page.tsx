'use client'

import React from 'react'
import { useWeb3 } from '../../hooks/useWeb3'

export default function TestWalletPage() {
  const { 
    walletStatus, 
    isConnected, 
    hasWallet, 
    address, 
    chainId, 
    balanceEth, 
    isSepolia,
    error,
    connect,
    disconnect,
    signer,
    provider
  } = useWeb3()

  const hasEthereum = typeof window !== 'undefined' && !!window.ethereum

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <h1 className="text-2xl font-bold tracking-tight">Test Wallet 🛠️</h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-semibold">
            Validation Harness - Phase 6 Block 1
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Section: Buttons */}
          <div className="flex flex-wrap gap-4 justify-center py-4 border-b border-slate-100">
            <button
              onClick={() => connect()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
              disabled={walletStatus === 'connecting'}
            >
              Connect Wallet
            </button>
            <button
              onClick={() => disconnect()}
              className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-bold transition-all active:scale-95"
            >
              Disconnect (Local Reset)
            </button>
          </div>

          {/* Section: State Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</h2>
              <div className="space-y-2">
                <InfoItem label="Wallet Status" value={walletStatus} highlight={walletStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'} />
                <InfoItem label="Has Wallet?" value={hasWallet ? '✅ Yes' : '❌ No'} />
                <InfoItem label="Is Connected?" value={isConnected ? '✅ Yes' : '❌ No'} />
                <InfoItem label="Is Sepolia?" value={isSepolia ? '✅ Yes' : '❌ No'} />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identity</h2>
              <div className="space-y-2">
                <InfoItem label="Address" value={address || 'None'} mono />
                <InfoItem label="Chain ID" value={chainId?.toString() || 'None'} />
                <InfoItem label="Balance" value={balanceEth ? `${balanceEth} ETH` : 'None'} />
              </div>
            </div>
          </div>

          {/* Section: Debug */}
          <div className="p-6 bg-slate-50 rounded-xl space-y-3">
             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Diagnostics</h2>
             <div className="grid grid-cols-2 gap-4">
               <DebugItem label="window.ethereum" status={hasEthereum} />
               <DebugItem label="signer instance" status={!!signer} />
               <DebugItem label="provider instance" status={!!provider} />
               <DebugItem label="system error" status={!error} errorMsg={error} />
             </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-400 italic">
              Check browser console (F12) for detailed logs: "Web3 Event: accountsChanged/chainChanged"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, highlight, mono }: { label: string, value: string, highlight?: string, mono?: boolean }) {
  return (
    <div className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-white shadow-sm">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={`text-xs font-bold ${mono ? 'font-mono break-all text-[10px]' : ''} ${highlight || 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  )
}

function DebugItem({ label, status, errorMsg }: { label: string, status: boolean, errorMsg?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`size-2 rounded-full ${status ? 'bg-emerald-500' : errorMsg ? 'bg-red-500' : 'bg-slate-300'}`}></div>
      <span className={`text-[10px] font-bold uppercase tracking-tight ${status ? 'text-emerald-700' : errorMsg ? 'text-red-700' : 'text-slate-400'}`}>
        {label} {errorMsg ? `(${errorMsg})` : ''}
      </span>
    </div>
  )
}
