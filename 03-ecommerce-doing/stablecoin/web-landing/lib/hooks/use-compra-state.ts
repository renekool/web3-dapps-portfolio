import { useState, useCallback } from 'react';

export type CompraStep = 'idle' | 'editing-amount' | 'creating-intent' | 'ready-to-pay' | 'confirming-pay' | 'processing' | 'success' | 'error';

export function useCompraState() {
  const [step, setStep] = useState<CompraStep>('editing-amount');
  const [error, setError] = useState<string | null>(null);

  const transitionTo = useCallback((nextStep: CompraStep) => {
    setStep(nextStep);
    if (nextStep !== 'error') setError(null);
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg);
    setStep('error');
  }, []);

  return {
    step,
    error,
    transitionTo,
    handleError,
    // Helpers
    isEditing: step === 'editing-amount',
    isCreatingIntent: step === 'creating-intent',
    isReady: step === 'ready-to-pay',
    isConfirming: step === 'confirming-pay',
    isProcessing: step === 'processing',
    isSuccess: step === 'success',
    isError: step === 'error',
  };
}
