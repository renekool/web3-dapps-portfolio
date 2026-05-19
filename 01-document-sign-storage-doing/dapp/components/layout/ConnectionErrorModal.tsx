'use client'

import React from 'react'
import { ShieldAlert, X, RefreshCw } from 'lucide-react'
import { useWeb3 } from '../../hooks/useWeb3'

export function ConnectionErrorModal() {
  const { error, clearError, connect } = useWeb3()

  if (!error) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={clearError} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Header Decor */}
        <div className="h-2 bg-gradient-to-r from-rose-500 to-amber-500" />
        
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="size-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 dark:border-rose-500/10">
              <ShieldAlert size={30} strokeWidth={1.5} />
            </div>
            <button 
              onClick={clearError}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 dark:text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Connection Blocked
            </h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-sm">
              {error}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 space-y-3">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
               Technical Guidance
             </p>
             <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-[1.6]">
               Your provider (MetaMask/Rabby) reported a mismatch while on an incompatible network. Please ensure your wallet is set to <span className="text-rose-500 font-bold">Sepolia Testnet</span> and try again.
             </p>
          </div>

          <div className="flex gap-3 pt-2">
             <button 
               onClick={clearError}
               className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
             >
               Dismiss
             </button>
             <button 
               onClick={() => {
                 clearError();
                 connect();
               }}
               className="flex-1 px-6 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
             >
               <RefreshCw size={14} />
               Retry
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
