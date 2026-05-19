'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ShieldCheck, Loader2, AlertTriangle, Check, ArrowRight, Info } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useBalance, useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData, parseEther, formatEther } from 'viem';
import DAOVotingABI from '@/lib/abi/DAOVoting.json';
import { useDAOStore } from '@/lib/store/useDAOStore';
import { useGasless } from '@/hooks/useGasless';
import { useGaslessPreference } from '@/context/GaslessContext';
import { GaslessOverlay } from '@/components/GaslessOverlay';
import { BaseModal } from '@/components/BaseModal';

const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

type DepositStep = 'input' | 'processing' | 'success' | 'error';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose
}) => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data: walletBalance } = useBalance({ 
    address,
    query: {
      refetchInterval: 2500,
    }
  });
  const { votingPower, userDeposit, totalDeposited } = useDAOStore();

  const [depositAmount, setDepositAmount] = useState('');
  const [step, setStep] = useState<DepositStep>('input');
  const [errorMessage, setErrorMessage] = useState('');

  // --- Gasless Hook ---
  const { isGaslessEnabled } = useGaslessPreference();
  const { 
    executeGasless, 
    status: gaslessStatus, 
    error: gaslessError, 
    txHash: gaslessHash, 
    isProcessing: isGaslessProcessing,
    proceedDirectly: proceedDirectlyGasless,
    reset: resetGasless,
    setStatus: setGaslessStatus
  } = useGasless();

  // --- Contract Write ---
  const { writeContract, data: txHash, isPending: isSigning, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isFailed, error: txError } = useWaitForTransactionReceipt({ 
    hash: txHash || (gaslessStatus === 'confirming' ? (gaslessHash as `0x${string}`) : undefined) 
  });

  const isProcessing = step === 'processing' || isGaslessProcessing;

  // --- Debug Logs ---
  useEffect(() => {
    if (isOpen) {
      console.log("[DepositModal] Current State:", { 
        step, 
        isGaslessEnabled, 
        gaslessStatus, 
        isGaslessProcessing, 
        isSigning, 
        isConfirming, 
        isConfirmed,
        txHash: txHash || gaslessHash
      });
    }
  }, [isOpen, step, isGaslessEnabled, gaslessStatus, isGaslessProcessing, isSigning, isConfirming, isConfirmed, txHash, gaslessHash]);

  // --- Handlers & Effects ---
  useEffect(() => {
    if ((isConfirmed || gaslessStatus === 'success') && step === 'processing') {
      queryClient.invalidateQueries(); 
      setStep('success');
    }
  }, [isConfirmed, gaslessStatus, step, queryClient]);

  // Special sync for gaslessHash
  useEffect(() => {
    if (gaslessStatus === 'confirming' && isConfirmed) {
      console.log("[DepositModal] Gasless Transaction confirmed! Finalizing status...");
      setGaslessStatus('success');
      queryClient.invalidateQueries();
    }
  }, [gaslessStatus, isConfirmed, queryClient, setGaslessStatus]);

  useEffect(() => {
    const activeError = writeError || txError || (gaslessStatus === 'error' ? gaslessError : null);
    if ((activeError || isFailed) && step === 'processing') {
      const msg = typeof activeError === 'string' ? activeError : (activeError as any)?.message || 'Transaction failed on chain';
      
      const isUserRejected = msg.toLowerCase().includes('user rejected') || 
                             msg.toLowerCase().includes('rejected') || 
                             (activeError as any)?.code === 4001;

      if (isUserRejected) {
        console.log("[DepositModal] User cancelled the transaction.");
        setStep('input');
        resetWrite();
        resetGasless();
        return;
      }

      setErrorMessage(msg);
      if (isFailed) setGaslessStatus('error');
      setStep('error');
    }
  }, [writeError, txError, isFailed, gaslessStatus, gaslessError, step, setGaslessStatus]);

  const minDeposit = useMemo(() => {
    if (totalDeposited === 0) return 0.05; // Bootstrap
    return totalDeposited / 100;
  }, [totalDeposited]);

  const isAmountTooLow = useMemo(() => {
    const val = parseFloat(depositAmount) || 0;
    return val > 0 && val < minDeposit;
  }, [depositAmount, minDeposit]);

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0 || isAmountTooLow) return;
    
    // RESET all states before new attempt to avoid stale tx hashes (e.g. from failed Rabby direct tx)
    resetWrite();
    resetGasless();
    setStep('processing');
    setErrorMessage('');
    
    const value = parseEther(depositAmount);
    const calldata = encodeFunctionData({ abi: DAOVotingABI, functionName: 'deposit' });

    console.log(`[DepositModal] Initiating deposit of ${depositAmount} ETH. Min required: ${minDeposit} ETH`);

    try {
      if (isGaslessEnabled) {
        await executeGasless(DAO_ADDRESS, calldata, value);
      } else {
        // Direct flow: we must catch the error if the user rejects or it fails
        try {
          await writeContract({ address: DAO_ADDRESS, abi: DAOVotingABI, functionName: 'deposit', value });
        } catch (directErr: any) {
          console.error("[DepositModal] Direct write failed:", directErr);
          setErrorMessage(directErr.message || 'Failed to initiate transaction');
          setStep('error');
        }
      }
    } catch (err: any) {
      console.error("[DepositModal] handleDeposit outer error:", err);
      setStep('error');
      setErrorMessage(err.message || 'Operation failed');
    }
  };

  const handleSafeClose = () => {
    if (isProcessing) return;
    setDepositAmount('');
    setStep('input');
    setErrorMessage('');
    resetWrite();
    resetGasless();
    onClose();
  };

  // Dynamic Calculations (Restored Accuracy)
  const balanceDisplay = walletBalance ? `${parseFloat(formatEther(walletBalance.value)).toFixed(2)}` : '0.00';
  const currentPowerDisplay = `${(votingPower * 100).toFixed(2)}%`;
  
  const estimatedPower = useMemo(() => {
    const amount = parseFloat(depositAmount) || 0;
    if (amount === 0) return currentPowerDisplay;
    const newTotal = totalDeposited + amount;
    const newUser = userDeposit + amount;
    return `${((newUser / newTotal) * 100).toFixed(2)}%`;
  }, [depositAmount, userDeposit, totalDeposited, currentPowerDisplay]);

  const powerIncrease = useMemo(() => {
    const val = parseFloat(estimatedPower) - parseFloat(currentPowerDisplay);
    return `+${val.toFixed(2)}%`;
  }, [estimatedPower, currentPowerDisplay]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleSafeClose}
      isProcessing={isProcessing}
      title={step !== 'success' && !isGaslessProcessing ? "Deposit to DAO" : undefined}
      description={step === 'input' && !isGaslessProcessing ? "Gain voting power by depositing ETH into the shared treasury. Your contribution directly impacts governance." : undefined}
    >
      {isGaslessProcessing ? (
        <GaslessOverlay 
          isEmbedded
          status={gaslessStatus}
          error={gaslessError}
          txHash={gaslessHash}
          onCancel={handleSafeClose}
          onProceedDirect={proceedDirectlyGasless}
        />
      ) : (
        <div className="w-full">
          {step === 'input' && (
            <>
              {/* Governance Context (Restored design with dynamic logic) */}
              <div className="px-8 mt-6">
                <div className="flex items-center gap-4 p-5 rounded-xl border border-primary/30 bg-primary/10 transition-all duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-dark-green">
                    <Wallet className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-green">Your current weight</p>
                    <p className="text-2xl font-bold text-deep-black">{currentPowerDisplay}</p>
                  </div>
                  <div className="ml-auto flex flex-col items-end">
                    <span className="text-xs font-bold text-dark-green/60 leading-none mb-1">Impact</span>
                    <span className="text-sm font-bold text-dark-green">{powerIncrease}</span>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="p-8 space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-semibold text-deep-black">Amount to Deposit</label>
                    <span className="text-xs text-slate-400">Balance: {balanceDisplay} ETH</span>
                  </div>
                  <div className="relative group">
                    <input 
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="block w-full h-14 pl-5 pr-16 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:bg-slate-50/50 focus:shadow-sm bg-white outline-none transition-all duration-150 ease-in-out text-lg font-medium text-slate-900"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <span className="text-sm font-bold text-slate-400">ETH</span>
                    </div>
                  </div>
                  
                  {/* Dynamic Helper Text */}
                  <div className="flex items-center gap-1.5 px-0.5 mt-1 transition-all duration-300">
                    <Info className="size-3.5 text-slate-400" />
                    <p className="text-xs text-slate-500 font-normal">
                      Minimum required deposit: <span className="text-dark-green font-medium">{minDeposit.toFixed(2)} ETH</span> 
                      <span className="text-slate-400">
                        {totalDeposited === 0 ? ' (initial funding requirement)' : ' (1% of treasury)'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Validation Warning */}
                {isAmountTooLow && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Amount too low</p>
                      <p>The DAO requires a minimum deposit of {minDeposit.toFixed(4)} ETH (1% of treasury).</p>
                    </div>
                  </div>
                )}

                {/* Confirm Action */}
                <div className="pt-2">
                  <button 
                    onClick={handleDeposit}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isAmountTooLow}
                    className="w-full h-14 bg-primary hover:brightness-105 active:scale-[0.98] transition-all duration-200 rounded-xl flex items-center justify-center gap-2 text-dark-green font-bold text-lg shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Confirm Deposit</span>
                    <ArrowRight className="size-5" />
                  </button>
                </div>

                {/* Security/Flow Context */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                    <ShieldCheck className="size-3.5" />
                    <span>{isGaslessEnabled ? 'Gasless flow enabled' : 'On-chain transaction'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center leading-tight max-w-[320px] opacity-60">
                    Your contribution directly increases your influence in the DAO. Actions are irreversible once confirmed on the blockchain.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="p-8 py-16 flex flex-col items-center text-center">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                <Loader2 className="size-10 text-primary animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-deep-black mb-2 font-display">
                {isSigning ? 'Check Wallet...' : 'Confirming...'}
              </h3>
              <p className="text-slate-500 text-sm max-w-[280px]">
                {isSigning 
                  ? 'Please sign the transaction in your wallet extension.'
                  : 'Waiting for the blockchain to validate your deposit request.'}
              </p>
              {txHash && (
                <p className="mt-4 text-[10px] text-slate-400 font-mono break-all px-4">
                  TX: {txHash}
                </p>
              )}
            </div>
          )}

          {step === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center text-center mt-2"
            >
              {/* Reference Success Visual Log: lines 867-873 of app/dapp/page.tsx */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75"></div>
                <div className="relative size-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white shadow-sm">
                  <div className="size-12 rounded-full bg-primary flex items-center justify-center text-dark-green shadow-md">
                    <Check className="size-6 stroke-[3]" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-deep-black mb-2 font-display tracking-tight leading-tight">Deposit Successful!</h2>
              <p className="text-slate-500 mb-8 text-sm max-w-[300px]">
                Your <span className="font-bold text-deep-black">{depositAmount} ETH</span> has been recorded in the DAO treasury.
              </p>

              {/* Dynamic Logic: Restored Accuracy for Estimated Power */}
              <div className="w-full bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3 mb-8">
                <span className="text-dark-green font-medium text-sm">New voting weight:</span>
                <span className="text-dark-green font-bold text-lg">{estimatedPower}</span>
                <span className="text-xs font-bold text-dark-green/60 ml-1">{powerIncrease}</span>
              </div>

              <button 
                onClick={handleSafeClose}
                className="w-full h-14 bg-primary hover:brightness-105 active:scale-[0.98] transition-all duration-200 rounded-xl flex items-center justify-center text-dark-green font-bold text-lg shadow-lg shadow-primary/20 cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          )}

          {step === 'error' && (
            <div className="p-8 py-12 flex flex-col items-center text-center">
              <div className="size-20 rounded-full bg-red-50 flex items-center justify-center border-4 border-white shadow-sm mb-6">
                <AlertTriangle className="size-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-deep-black mb-2 font-display">Transaction Failed</h3>
              <p className="text-sm text-red-600 font-medium mb-8 px-4 leading-relaxed">{errorMessage}</p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setStep('input')} 
                  className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
                >
                  Try Again
                </button>
                <button 
                  onClick={handleSafeClose} 
                  className="flex-1 h-12 bg-primary hover:brightness-105 rounded-xl font-bold text-dark-green shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
};
