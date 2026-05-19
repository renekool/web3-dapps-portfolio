'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Wallet } from 'lucide-react';
import { BaseModal } from '@/components/BaseModal';

interface VotingPowerAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: () => void;
  userDeposit: number;
}

export const VotingPowerAlertModal: React.FC<VotingPowerAlertModalProps> = ({
  isOpen,
  onClose,
  onDeposit,
  userDeposit,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[480px]"
      showCloseButton={false}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 flex flex-col items-center text-center my-4"
      >
        <div className="relative mb-6">
          <div className="relative size-20 rounded-full bg-amber-50 flex items-center justify-center border-4 border-white shadow-sm">
            <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shadow-md">
              <ShieldAlert className="size-6 stroke-[2]" />
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-deep-black mb-2 font-display tracking-tight leading-tight">No Voting Power</h3>
        
        <p className="text-slate-500 mb-8 text-sm max-w-[320px]">
          Your current balance is <span className="font-bold text-deep-black">{userDeposit.toFixed(4)} ETH</span>. You need to deposit funds higher than <span className="font-bold">0.01 ETH</span> to create proposals or vote.
        </p>

        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={onDeposit}
            className="flex items-center justify-center gap-3 w-full h-14 bg-dark-green text-primary font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-dark-green/20 cursor-pointer"
          >
            <Wallet className="size-5" />
            Deposit Funds
          </button>
          <button 
            onClick={onClose}
            className="w-full h-14 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 font-bold text-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </BaseModal>
  );
};
