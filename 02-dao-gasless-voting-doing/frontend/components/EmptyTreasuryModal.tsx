'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Wallet, Plus } from 'lucide-react';
import { BaseModal } from '@/components/BaseModal';

interface EmptyTreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: () => void;
}

export const EmptyTreasuryModal: React.FC<EmptyTreasuryModalProps> = ({
  isOpen,
  onClose,
  onDeposit,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[440px]"
      showCloseButton={false}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 flex flex-col items-center text-center my-4"
      >
        <div className="relative mb-6">
          <div className="relative size-20 rounded-full bg-red-50 flex items-center justify-center border-4 border-white shadow-sm">
            <div className="size-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 shadow-md">
              <ShieldAlert className="size-6 stroke-[2]" />
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-deep-black mb-2 font-display tracking-tight leading-tight">Treasury is Empty</h3>
        
        <p className="text-slate-500 mb-8 text-sm max-w-[320px]">
          The DAO currently has <span className="font-bold text-deep-black">0 ETH</span> in its treasury. Proposals require a funded treasury to be executed.
        </p>

        <div className="w-full flex flex-col gap-3 px-4">
          <button 
            onClick={onDeposit}
            className="w-full h-14 bg-dark-green hover:bg-[#05462b] active:scale-[0.98] transition-colors duration-200 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-dark-green/20 cursor-pointer border border-transparent hover:border-primary/20"
          >
            <Wallet className="size-5 text-primary stroke-[2.5]" />
            <span className="font-bold text-primary text-lg">Deposit Funds</span>
          </button>
          
          <button 
            onClick={onClose}
            className="w-full h-14 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </BaseModal>
  );
};
