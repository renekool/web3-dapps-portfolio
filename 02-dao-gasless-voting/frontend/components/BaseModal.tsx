'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  isProcessing?: boolean;
  maxWidth?: string;
  className?: string;
  showCloseButton?: boolean;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  isProcessing = false,
  maxWidth = 'max-w-[520px]',
  className = '',
  showCloseButton = true
}) => {
  // Block ESC key during processing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProcessing) {
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'Escape' && !isProcessing && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, isProcessing, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          key="modal-portal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Backdrop (Restored to DAO Green) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className={`absolute inset-0 bg-dark-green/40 backdrop-blur-sm ${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />

          {/* Modal Container (Aligned to rounded-2xl & shadow-2xl) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100/50 ${className}`}
          >
            {/* Modal Header (Restored to original spacing p-8) */}
            {title && (
              <div className="p-8 pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h2>
                  {showCloseButton && (
                    <button 
                      onClick={() => !isProcessing && onClose()}
                      disabled={isProcessing}
                      className={`text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1.5 -mr-1.5 rounded-full transition-all active:scale-95 ${isProcessing ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <X className="size-6" />
                    </button>
                  )}
                </div>
                {description && (
                  <p className="text-slate-500 mt-1 text-sm leading-relaxed max-w-[420px]">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Standardized Content Container */}
            <div className="flex-1 w-full relative">
              {children}
            </div>

            {/* Optional Bottom Accent (Standard in Original) */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-dark-green to-primary opacity-10"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
