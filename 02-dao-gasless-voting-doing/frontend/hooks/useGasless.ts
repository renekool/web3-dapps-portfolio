'use client'

import { useAccount, useSignTypedData, usePublicClient, useChainId, useWriteContract, useSwitchChain } from 'wagmi';
import { useCallback, useState } from 'react';
import FORWARDER_ABI from '@/lib/abi/MinimalForwarder.json';

const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS as `0x${string}`;
const RELAY_API = '/api/relay';
const RELAY_TIMEOUT = 30000;

export type GaslessError =
  | 'RELAYER_INSUFFICIENT_FUNDS'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_SIGNATURE'
  | 'INVALID_NONCE'
  | 'EXECUTION_FAILED'
  | 'WRONG_NETWORK';

export type GaslessStatus = 
  | 'idle' 
  | 'signing' 
  | 'relaying' 
  | 'confirming' 
  | 'success' 
  | 'error' 
  | 'fallback_pending';

export type ExecutionMode = 'gasless' | 'direct';

export const useGasless = () => {
  const { address, chain: walletChain } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  
  const [status, setStatus] = useState<GaslessStatus>('idle');
  const [error, setError] = useState<GaslessError | string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [executionMode, setExecutionMode] = useState<ExecutionMode | null>(null);
  
  // Cache for fallback data
  const [pendingAction, setPendingAction] = useState<{ target: string; calldata: string } | null>(null);

  const executeGasless = useCallback(async (target: string, calldata: string, value: bigint = BigInt(0)) => {
    if (!address || !publicClient) {
      setError('Wallet not connected');
      setStatus('error');
      return;
    }

    setStatus('signing');
    setError(null);
    setTxHash(null);
    setExecutionMode('gasless');
    setPendingAction({ target, calldata });

    try {
      // 0. Ensure correct network
      if (walletChain?.id !== chainId) {
        console.log(`[useGasless] Chain mismatch detected. App: ${chainId}, Wallet: ${walletChain?.id}. Attempting switch...`);
        try {
          await switchChainAsync({ chainId });
        } catch (switchErr) {
          console.error('[useGasless] Switch chain failed:', switchErr);
          setStatus('error');
          setError('WRONG_NETWORK');
          return;
        }
      }

      // 1. Nonce & Domain
      const nonce = await publicClient.readContract({
        address: FORWARDER_ADDRESS,
        abi: FORWARDER_ABI,
        functionName: 'getNonce',
        args: [address],
      }) as bigint;

      const domain = {
        name: 'MinimalForwarder',
        version: '1',
        chainId,
        verifyingContract: FORWARDER_ADDRESS,
      } as const;

      const types = {
        ForwardRequest: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'gas', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'data', type: 'bytes' },
        ],
      } as const;

      const message = {
        from: address,
        to: target as `0x${string}`,
        value: value,
        gas: BigInt(1000000), // Secure limit
        nonce,
        data: calldata as `0x${string}`,
      };

      // 2. Sign
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'ForwardRequest',
        message,
      });

      // 3. Relay
      setStatus('relaying');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RELAY_TIMEOUT);

      try {
        const response = await fetch(RELAY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request: {
              ...message,
              value: message.value.toString(),
              gas: message.gas.toString(),
              nonce: message.nonce.toString()
            },
            signature
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const result = await response.json();

        console.log(`[useGasless] Relay Response:`, result);
        if (!response.ok || !result.success) {
          const errorCode = (result.error || 'EXECUTION_FAILED') as GaslessError;
          console.warn(`[useGasless] Relay Request rejected:`, errorCode, result.details);
          handleError(errorCode, result.details);
          return;
        }

        console.log(`[useGasless] Success! Setting txHash:`, result.txHash);
        setTxHash(result.txHash);
        setStatus('confirming');
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          handleError('TIMEOUT');
        } else {
          handleError('NETWORK_ERROR');
        }
      }

    } catch (err: any) {
      console.error('[useGasless] Critical Error:', err);
      setStatus('error');
      setError(err.shortMessage || 'EXECUTION_FAILED');
    }
  }, [address, chainId, walletChain, switchChainAsync, publicClient, signTypedDataAsync]);

  const handleError = (code: GaslessError, details?: string) => {
    console.warn(`[useGasless] Handled Error: ${code}`, details);
    setError(code);

    const isInfrastructureError = 
      code === 'RELAYER_INSUFFICIENT_FUNDS' || 
      code === 'TIMEOUT' || 
      code === 'NETWORK_ERROR';

    if (isInfrastructureError) {
      setStatus('fallback_pending');
    } else {
      setStatus('error');
    }
  };

  const proceedDirectly = async (abi?: any) => {
    if (!pendingAction || !address) return;
    
    setStatus('confirming');
    setExecutionMode('direct');
    setError(null);

    try {
      // For direct execution, we decompose the calldata or just use writeContract
      // Since we already have calldata, we might need to parse it or use an override
      // In this DAO, we'll assume we know the target function (hardcoded fallback for now or generic)
      
      console.log('[useGasless] Proceeding with direct transaction to:', pendingAction.target);
      
      // Generic writeContract with data is complex in wagmi, ideally we use the original action
      // But for this requirement, we'll signal the UI to perform a normal write.
      // Alternatively, we use sendTransaction if we have raw data.
      
      // We return the intent to the UI
      return pendingAction;
    } catch (err: any) {
      setStatus('error');
      setError(err.shortMessage || 'DIRECT_EXECUTION_FAILED');
    }
  };

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
    setExecutionMode(null);
    setPendingAction(null);
  }, []);

  return {
    executeGasless,
    proceedDirectly,
    status,
    isProcessing: status === 'signing' || status === 'relaying' || status === 'confirming',
    error,
    txHash,
    executionMode,
    reset,
    setStatus,
    pendingAction
  };
};
