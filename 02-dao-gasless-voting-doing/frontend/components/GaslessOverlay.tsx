'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Fuel, ShieldAlert, Check, X, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { GaslessStatus, GaslessError } from '@/hooks/useGasless';

type GaslessOverlayProps = {
  status: GaslessStatus;
  error: string | GaslessError | null;
  onCancel: () => void;
  onProceedDirect: () => void;
  txHash?: string | null;
  isEmbedded?: boolean;
};

export function GaslessOverlay({ status, error, onCancel, onProceedDirect, txHash, isEmbedded = false }: GaslessOverlayProps) {
  if (status === 'idle') return null;

  const isProcessing = status === 'signing' || status === 'relaying' || status === 'confirming';

  const content = (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className={`${isEmbedded ? 'w-full px-8 py-4' : 'bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 max-w-[400px] w-full'} flex flex-col items-center text-center relative`}
    >
      {/* Header Icon - Restored to original success/process circular style */}
      <div className="relative mb-6">
        {status === 'success' && (
          <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75"></div>
        )}
        <div className={`relative size-20 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${
          status === 'error' ? 'bg-red-50' : 
          status === 'fallback_pending' ? 'bg-amber-50' :
          status === 'success' ? 'bg-primary/20' :
          'bg-primary/10'
        }`}>
          {status === 'signing' && <ShieldCheck className="size-10 text-primary" />}
          {status === 'relaying' && <Fuel className="size-10 text-primary animate-pulse" />}
          {status === 'confirming' && <Loader2 className="size-10 text-primary animate-spin" />}
          {status === 'success' && (
            <div className="size-12 rounded-full bg-primary flex items-center justify-center text-dark-green shadow-md">
              <Check className="size-6 stroke-[3]" />
            </div>
          )}
          {status === 'error' && <AlertTriangle className="size-10 text-red-500" />}
          {status === 'fallback_pending' && <ShieldAlert className="size-10 text-amber-500" />}
        </div>
      </div>

      {/* Texts Aligned to font-display 2xl */}
      <h3 className="text-2xl font-bold text-slate-900 mb-2 font-display tracking-tight leading-tight">
        {status === 'signing' && 'Confirm Identity'}
        {status === 'relaying' && 'Relaying Action'}
        {status === 'confirming' && 'Finalizing...'}
        {status === 'success' && 'Action Successful!'}
        {status === 'error' && 'Transaction Error'}
        {status === 'fallback_pending' && 'Gasless Unavailable'}
      </h3>

      <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8 max-w-[280px]">
        {status === 'signing' && 'Securely signing your request via EIP-712. No gas fees will be charged.'}
        {status === 'relaying' && 'Our relayer is broadcasting your signed intent to the network...'}
        {status === 'confirming' && 'Transaction broadcasted. Waiting for network inclusion...'}
        {status === 'success' && 'Your governance action has been verified and recorded.'}
        {status === 'error' && `${error || 'An unexpected error occurred during execution.'}`}
        {status === 'fallback_pending' && 'Relayer connection issue. You can continue by paying your own gas.'}
      </p>

      {/* Action Buttons - Restored to original h-14 rounded-xl shadow-lg */}
      <div className="w-full space-y-3">
        {status === 'fallback_pending' && (
          <>
            <button 
              onClick={onProceedDirect}
              className="w-full h-14 bg-dark-green text-white rounded-xl font-bold shadow-lg shadow-dark-green/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Continue Manually <ArrowRight className="size-4" />
            </button>
            <button 
              onClick={onCancel}
              className="w-full h-12 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
            >
              Cancel
            </button>
          </>
        )}

        {status === 'success' && (
          <button 
            onClick={onCancel}
            className="w-full h-14 bg-primary text-dark-green rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            Done
          </button>
        )}

        {(status === 'error') && (
          <button 
            onClick={onCancel}
            className="w-full h-14 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-all"
          >
            Close
          </button>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center gap-4 w-full">
            {!txHash ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="size-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="size-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 bg-slate-50/80 rounded-xl border border-slate-100 w-full animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">TX PENDING</span>
                </div>
                <p className="text-[9px] text-slate-400 font-mono break-all px-6 opacity-60">
                  {txHash}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  if (isEmbedded) return content;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-green/40 backdrop-blur-sm px-4"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

