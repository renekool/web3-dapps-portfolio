'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ShieldCheck, Loader2, AlertTriangle, Check, X, ShieldAlert, Plus } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData, parseEther, isAddress } from 'viem';
import DAOVotingABI from '@/lib/abi/DAOVoting.json';
import { useDAOStore } from '@/lib/store/useDAOStore';
import { useGasless } from '@/hooks/useGasless';
import { useGaslessPreference } from '@/context/GaslessContext';
import { GaslessOverlay } from '@/components/GaslessOverlay';
import { BaseModal } from '@/components/BaseModal';
import { useSendTransaction } from 'wagmi';

const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

type ProposalStep = 'form' | 'processing' | 'success' | 'error';

interface NewProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProposalModal: React.FC<NewProposalModalProps> = ({
  isOpen,
  onClose
}) => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { votingPower, totalDeposited } = useDAOStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<ProposalStep>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [touchedTitle, setTouchedTitle] = useState(false);
  const [touchedDescription, setTouchedDescription] = useState(false);
  const [touchedRecipient, setTouchedRecipient] = useState(false);
  const [signingStartTime, setSigningStartTime] = useState<number | null>(null);
  const [isSignTooLong, setIsSignTooLong] = useState(false);

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
  const { writeContractAsync, data: txHash, isPending: isSigning, error: writeError, reset: resetWrite } = useWriteContract();
  const [manualTxHash, setManualTxHash] = useState<`0x${string}` | null>(null);
  
  // Use the exact same logic as Voting: purely live data from hooks
  const activeHash = (manualTxHash || txHash || (gaslessStatus === 'confirming' || gaslessStatus === 'success' ? (gaslessHash as `0x${string}`) : undefined)) as `0x${string}` | undefined;

  const { data: txReceipt, isLoading: isConfirming, isSuccess: isConfirmed, isError: isFailed, error: txError } = useWaitForTransactionReceipt({ 
    hash: activeHash
  });

  const isProcessing = step === 'processing' || isGaslessProcessing;
  const isDirectSigning = isSigning;
  const isDirectConfirming = isConfirming;

  // Monitor signing time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSigning && !isSignTooLong) {
      timer = setTimeout(() => {
        setIsSignTooLong(true);
      }, 7000); // Show hint after 7 seconds
    } else if (!isSigning) {
      setIsSignTooLong(false);
    }
    return () => clearTimeout(timer);
  }, [isSigning, isSignTooLong]);

  useEffect(() => {
    const isReverted = txReceipt?.status === 'reverted';
    const activeError = writeError || txError || (gaslessStatus === 'error' ? gaslessError : null) || (isReverted ? "Transaction reverted on chain" : null);

    if ((activeError || isFailed || (isConfirmed && isReverted)) && step === 'processing') {
      const msg = typeof activeError === 'string' ? activeError : (activeError as any)?.message || 'Transaction failed on chain';
      
      const isUserRejected = msg.toLowerCase().includes('user rejected') || 
                             msg.toLowerCase().includes('rejected') || 
                             (activeError as any)?.code === 4001;

      if (isUserRejected) {
        console.log("[NewProposalModal] User cancelled the transaction.");
        setStep('form');
        resetWrite();
        resetGasless();
        return;
      }

      setErrorMessage(msg);
      if (isFailed || isReverted) setGaslessStatus('error');
      setStep('error');
    }
  }, [writeError, txError, isFailed, gaslessStatus, gaslessError, step, setGaslessStatus, txReceipt, isConfirmed]);

  useEffect(() => {
    const isActuallySuccess = isConfirmed && txReceipt?.status === 'success';
    // Success condition: Must be confirming from our side and Confirmed from network
    const isGaslessSuccess = (gaslessStatus === 'confirming' && isConfirmed);

    if ((isActuallySuccess || isGaslessSuccess) && step === 'processing') {
      console.log("[NewProposalModal] SUCCESS DETECTED!");
      window.dispatchEvent(new Event('dao:proposalCreated'));
      queryClient.invalidateQueries(); 
      
      // Clear status after detection
      if (isGaslessEnabled && gaslessStatus !== 'idle') {
        resetGasless();
      }
      
      setStep('success');
    }
  }, [isConfirmed, txReceipt, gaslessStatus, step, queryClient, isGaslessEnabled, resetGasless]);

  const handleCreateProposal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title || !description || !recipient || !isAddress(recipient) || !amount || parseFloat(amount) <= 0 || votingPower < 0.01) {
      return;
    }

    resetWrite();
    setManualTxHash(null);
    resetGasless();
    
    setStep('processing');
    const fullDescription = `${title}|${description}`;
    
    try {
      const calldata = encodeFunctionData({
        abi: DAOVotingABI,
        functionName: 'createProposal',
        args: [recipient as `0x${string}`, parseEther(amount), fullDescription]
      });

      if (isGaslessEnabled) {
        await executeGasless(DAO_ADDRESS, calldata);
      } else {
        const hash = await writeContractAsync({ 
          address: DAO_ADDRESS, 
          abi: DAOVotingABI, 
          functionName: 'createProposal', 
          args: [recipient as `0x${string}`, parseEther(amount), fullDescription] 
        });
        
        setManualTxHash(hash);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to prepare transaction");
      setStep('error');
    }
  };

  const handleSafeClose = () => {
    if (isProcessing) return;
    setTitle('');
    setDescription('');
    setRecipient('');
    setAmount('');
    setStep('form');
    setTouchedTitle(false);
    setTouchedDescription(false);
    setTouchedRecipient(false);
    resetWrite();
    resetGasless();
    setManualTxHash(null);
    onClose();
  };

  const treasuryBalance = totalDeposited;
  const currentAmount = parseFloat(amount) || 0;
  const currentAmountRounded = Number(currentAmount.toFixed(6));
  const minEthRequired = Number((totalDeposited * 0.01).toFixed(6));
  const maxProposalAmount = Number((totalDeposited * 0.25).toFixed(6));
  
  // Validation Logic
  const hasValidTitle = title.length >= 5;
  const hasValidDescription = description.length >= 20;
  const hasValidRecipient = isAddress(recipient);
  const hasValidAmount = currentAmountRounded >= minEthRequired && currentAmount > 0;
  const isWithinTreasuryLimit = currentAmountRounded < maxProposalAmount;
  const hasSufficientWeight = votingPower >= 0.01;

  const isFormValid = hasValidTitle && hasValidDescription && hasValidRecipient && hasValidAmount && hasSufficientWeight && isWithinTreasuryLimit;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleSafeClose}
      isProcessing={isProcessing}
      maxWidth={isGaslessProcessing ? "max-w-[440px]" : "max-w-[560px]"}
      showCloseButton={false} 
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
          {step === 'form' && (
            <>
              {treasuryBalance === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 flex flex-col items-center text-center my-4"
                >
                  <div className="relative mb-6">
                    <div className="size-20 rounded-full bg-red-50 flex items-center justify-center border-4 border-white shadow-sm">
                      <div className="size-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 shadow-md">
                        <ShieldAlert className="size-6 stroke-[2]" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-deep-black mb-2 font-display">Treasury is Empty</h3>
                  <p className="text-slate-500 mb-8 text-sm max-w-[320px]">
                    The DAO currently has <span className="font-bold text-deep-black">0 ETH</span> in its treasury. Proposals require a funded treasury to be executed.
                  </p>
                  <div className="w-full flex flex-col gap-3 px-8">
                    <button 
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new Event('dao:openDeposit'));
                      }}
                      className="w-full h-14 bg-dark-green hover:bg-[#05462b] active:scale-[0.98] transition-colors duration-200 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-dark-green/20 cursor-pointer border border-transparent hover:border-primary/20"
                    >
                      <Wallet className="size-5 text-primary stroke-[2.5]" />
                      <span className="font-bold text-primary text-lg">Deposit Funds</span>
                    </button>
                    <button 
                      onClick={handleSafeClose}
                      className="w-full h-14 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="px-6 pt-6 pb-4 flex justify-between items-start">
                    <div>
                      <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Create New Proposal</h1>
                      <p className="text-slate-500 mt-1 text-sm">Submit a new governance action to the community for voting.</p>
                    </div>
                    <button 
                      onClick={handleSafeClose}
                      className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="size-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="px-6 py-2 overflow-y-auto max-h-[70vh]">
                    <div className="space-y-4">
                      {/* Proposal Title */}
                      <div className="space-y-1.5 flex flex-col">
                        <div className="flex justify-between items-center">
                          <label className="text-slate-900 text-sm font-bold">Proposal Title</label>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {title.length} / 120
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="relative">
                            <input 
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              onBlur={() => setTouchedTitle(true)}
                              className={`block w-full h-11 px-4 rounded-xl border outline-none transition-all duration-150 ease-in-out text-sm ${touchedTitle && !hasValidTitle ? 'border-red-300 focus:border-red-400 focus:bg-red-50/50 focus:shadow-sm bg-white' : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:bg-slate-50/50 focus:shadow-sm bg-white'}`} 
                              placeholder="e.g., Strategic Partnership with Protocol X" 
                            />
                          </div>
                          {touchedTitle && !hasValidTitle && (
                            <div className="text-[11px] text-red-500 font-normal tracking-tight px-1">
                              Title is too short (min 5 chars)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5 flex flex-col">
                        <div className="flex justify-between items-center">
                          <label className="text-slate-900 text-sm font-bold">Description</label>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {description.length} / 2000
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="relative">
                            <textarea 
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              onBlur={() => setTouchedDescription(true)}
                              className={`block w-full min-h-[100px] p-4 rounded-xl border outline-none transition-all duration-150 ease-in-out resize-none text-sm ${touchedDescription && !hasValidDescription ? 'border-red-300 focus:border-red-400 focus:bg-red-50/50 focus:shadow-sm bg-white' : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:bg-slate-50/50 focus:shadow-sm bg-white'}`} 
                              placeholder="Provide detailed context, goals, and implementation steps..."
                            />
                          </div>
                          {touchedDescription && !hasValidDescription && (
                            <div className="text-[11px] text-red-500 font-normal tracking-tight px-1">
                              Description is too short (min 20 chars)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recipient & Amount Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Recipient Column */}
                        <div className="space-y-1.5 flex flex-col">
                          <div className="flex items-center">
                            <label className="text-slate-900 text-sm font-bold">Recipient Address</label>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="relative">
                              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                              <input 
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                onBlur={() => setTouchedRecipient(true)}
                                className={`block w-full h-11 pl-10 pr-4 rounded-xl border outline-none transition-all duration-150 ease-in-out text-sm ${touchedRecipient && !hasValidRecipient ? 'border-red-300 focus:border-red-400 focus:bg-red-50/50 focus:shadow-sm bg-white' : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:bg-slate-50/50 focus:shadow-sm bg-white'}`} 
                                placeholder="0x..." 
                              />
                            </div>
                            {touchedRecipient && !hasValidRecipient && (
                              <div className="text-[11px] text-red-500 font-normal tracking-tight px-1">
                                Invalid Ethereum address
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amount Column */}
                        <div className="space-y-1.5 flex flex-col">
                          <div className="flex justify-between items-center h-5">
                            <label className="text-slate-900 text-sm font-bold">Amount</label>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Min: {minEthRequired.toFixed(4)} ETH
                            </div>
                          </div>
                          <div className="relative">
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">ETH</span>
                            <input 
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className={`block w-full h-11 pl-4 pr-16 rounded-xl border outline-none transition-all duration-150 ease-in-out text-sm placeholder:text-slate-400 ${!isWithinTreasuryLimit && currentAmount > 0 ? 'border-red-300 bg-red-50/30 focus:border-red-400' : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:bg-slate-50/50'}`} 
                              placeholder="0.00" 
                              step="0.01" 
                            />
                          </div>
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[11px] text-slate-400 font-normal tracking-tight">
                              Treasury Limit <span className="text-slate-600 font-medium">{"< "}{(totalDeposited * 0.25).toFixed(2)} ETH</span>
                            </span>
                            {!isWithinTreasuryLimit && currentAmount > 0 && (
                              <div className="text-[11px] text-red-500 font-normal animate-pulse flex items-center gap-1">
                                <AlertTriangle className="size-2.5" />
                                Limit Exceeded
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Validation Info Box */}
                      <div className="flex items-start gap-3 p-4 bg-[#f8fdf4] border border-[#e2f5d6] rounded-xl">
                        <div className="flex items-center justify-center size-5 rounded-full bg-dark-green text-white shrink-0 mt-0.5 shadow-sm">
                          <span className="text-[10px] font-bold font-serif italic">i</span>
                        </div>
                        <p className="text-[13px] text-dark-green/80 leading-snug">
                          <span className="font-bold text-dark-green">Note:</span> Proponents must hold at least 1% of total DAO weight to create proposals. Your current weight: <span className="font-bold">{(votingPower * 100).toFixed(2)}%</span>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-5 bg-slate-50 flex flex-col sm:flex-row-reverse gap-3 items-center border-t border-slate-100 mt-2">
                    <button 
                      onClick={() => handleCreateProposal()}
                      disabled={!isFormValid}
                      className={`w-full sm:w-auto px-6 py-[11px] font-semibold rounded-xl transition-all duration-300 active:scale-[0.98] text-sm cursor-pointer shadow-sm
                        border ${isFormValid 
                          ? 'bg-dark-green text-white hover:brightness-110 border-transparent' 
                          : 'bg-[#8DA593]/40 text-white/70 cursor-not-allowed border-slate-200'
                        }`}
                    >
                      Create Proposal
                    </button>
                    <button 
                      onClick={handleSafeClose}
                      className="w-full sm:w-auto px-6 py-2.5 text-slate-500 font-semibold hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
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
                  ? 'Please confirm the proposal creation in your wallet.'
                  : 'Wait while the blockchain validates your governance proposal.'}
              </p>
              {isSignTooLong && isSigning && (
                <p className="mt-4 text-xs text-orange-500 font-bold bg-orange-50 px-3 py-1.5 rounded-lg animate-pulse border border-orange-100">
                  ⚠️ MetaMask is taking a while. Check for hidden windows!
                </p>
              )}
              {isProcessing && (manualTxHash || txHash || gaslessHash) && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">TX PENDING</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono break-all px-6 opacity-60">
                    {manualTxHash || txHash || gaslessHash}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center text-center my-4"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75"></div>
                <div className="relative size-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white shadow-sm">
                  <div className="size-12 rounded-full bg-primary flex items-center justify-center text-dark-green shadow-md">
                    <Check className="size-6 stroke-[3]" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-deep-black mb-2 font-display">Proposal Created!</h2>
              <p className="text-slate-500 mb-8 text-sm max-w-[320px]">
                Your proposal has been successfully submitted to the DAO for voting.
              </p>
              <div className="w-full bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3 mb-8">
                <span className="text-dark-green font-medium text-sm">Status:</span>
                <span className="text-dark-green font-bold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-dark-green animate-pulse"></span>
                  Active for Voting
                </span>
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
              <h3 className="text-2xl font-bold text-deep-black mb-2 font-display">Creation Failed</h3>
              <p className="text-sm text-red-600 font-medium mb-8 px-4 leading-relaxed">{errorMessage}</p>
              <div className="flex gap-4 w-full px-8">
                <button 
                  onClick={() => setStep('form')} 
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
