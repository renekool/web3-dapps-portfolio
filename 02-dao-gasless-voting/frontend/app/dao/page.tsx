'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Landmark, Wallet, PieChart, PlusCircle, Plus, FileEdit, ShieldCheck, ChevronDown, Copy, LogOut, FileText, ChevronLeft, ChevronRight, X, ArrowRight, ShieldAlert, Inbox, Info, ThumbsUp, ThumbsDown, MinusCircle, Clock, ArrowLeft, Search, ArrowUpRight, Linkedin, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisconnect, useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useAccountEffect, useChainId, useSwitchChain } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatEther, encodeFunctionData } from 'viem';
import DAOVotingABI from '@/lib/abi/DAOVoting.json';
import { useGasless } from '@/hooks/useGasless';
import { useGaslessPreference } from '@/context/GaslessContext';
import { GaslessOverlay } from '@/components/GaslessOverlay';

const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

import { useRouter } from 'next/navigation';
import { GovernanceCard } from '@/components/GovernanceCard';
import { DepositModal } from '@/components/DepositModal';
import { NewProposalModal } from '@/components/NewProposalModal';
import { EmptyTreasuryModal } from '@/components/EmptyTreasuryModal';
import { TreasuryCard } from '@/components/TreasuryCard';
import { ProposalsList } from '@/components/ProposalsList';
import { ProposalDetail } from '@/components/ProposalDetail';
import { VotingPowerAlertModal } from '@/components/VotingPowerAlertModal';

import { useDAOStore, DAOProposal } from '@/lib/store/useDAOStore';
import { GaslessToggle } from '@/components/GaslessToggle';

// --- Senior Web3 Provider Standards ---
// 1. Defining strict interface for MetaMask/EIP-1193 Provider
// 2. Avoiding 'any' for direct ethereum interaction
interface MetaMaskProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<any>;
  on: (event: string, handler: (data: any) => void) => void;
  removeListener: (event: string, handler: (data: any) => void) => void;
  _metamask?: {
    isUnlocked: () => Promise<boolean>;
  };
}

export default function DappDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { 
    address, 
    votingPower, 
    totalDeposited, 
    userDeposit,
    proposals, 
    setProposals,
    voteInStore,
    isConnecting: storeIsConnecting,
    isInitializing,
    setInitializing,
    disconnect,
    resetWalletState,
    setAddress,
    blockchainTime,
    setBlockchainTime
  } = useDAOStore();

  const { address: wagmiAddress, isConnected, status: wagmiStatus, connector } = useAccount();
  const { data: balance } = useBalance({ 
    address: wagmiAddress,
    query: {
      refetchInterval: 2500, // Faster sync for local dev
    }
  });
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = chainId !== 31337;

  const [hasHydrated, setHasHydrated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOptimisticUI_Disconnected, setIsOptimisticUI_Disconnected] = useState(false);
  const [isDropdownClosingInstantly, setIsDropdownClosingInstantly] = useState(false);

  // Wagmi V2 Auth Lifecycles - Intercepta eventos asincrónicos de conectores
  useAccountEffect({
    onDisconnect() {
      console.log("[Auth] useAccountEffect: Wagmi connector triggered ON_DISCONNECT natively!");
      // Si ya estamos en modo optimista, solo redirigimos (el estado ya está limpio)
      if (isOptimisticUI_Disconnected) {
        window.location.href = '/';
      } else {
        setIsLoggingOut(true);
        resetWalletState();
        window.location.href = '/';
      }
    }
  });
  // Wait for store to hydrate from localStorage
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Handle initialization state based on Wagmi
  useEffect(() => {
    if (!hasHydrated) return;
    const isWagmiLoading = wagmiStatus === 'reconnecting' || wagmiStatus === 'connecting';
    if (!isWagmiLoading) {
      setInitializing(false);
    }
  }, [wagmiStatus, setInitializing, hasHydrated]);

  // Sync account and handle events
  useEffect(() => {
    const eth = (typeof window !== 'undefined' ? (window as any).ethereum : null) as MetaMaskProvider | null;
    
    const handleAccountsChanged = (accounts: string[]) => {
      console.log("Account change detected via MetaMask:", accounts);
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        console.log("[Auth] External Log out detected via accountsChanged");
        // Solo ejecutar si no estamos ya en modo optimista
        if (!isOptimisticUI_Disconnected) {
          setIsLoggingOut(true);
          resetWalletState();
        }
        window.location.href = '/';
      }
    };

    const handleWeb3Disconnect = () => {
      console.log("[Auth] External disconnect event");
      // Solo ejecutar si no estamos ya en modo optimista
      if (!isOptimisticUI_Disconnected) {
        setIsLoggingOut(true);
        resetWalletState();
      }
      window.location.href = '/';
    };

    if (eth && eth.on) {
      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('disconnect', handleWeb3Disconnect);

      return () => {
        eth.removeListener('accountsChanged', handleAccountsChanged);
        eth.removeListener('disconnect', handleWeb3Disconnect);
      };
    }
  }, [setAddress, resetWalletState, isOptimisticUI_Disconnected]);

  // Watchdog Híbrido: Polling Controlado para el Cierre Oculto de MetaMask
  useEffect(() => {
    // Solo activo si el usuario cree estar conectado según Zustand store
    if (!address) return;
    
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        // Obtenemos el provider ya sea del conector activo o el global window.ethereum
        const provider = ((connector && typeof connector.getProvider === 'function') 
          ? await connector.getProvider() 
          : (typeof window !== 'undefined' ? (window as any).ethereum : null)) as MetaMaskProvider | null;

        if (provider && typeof provider.request === 'function') {
           const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
           
           // Truco sucio MetaMask: a veces sigue enviando `accounts` de sitios locales incluso bloqueado.
           // Es OBLIGATORIO chequear si el estado literal interno arroja isUnlocked=false.
           let isUnlocked = true;
           if (typeof provider._metamask?.isUnlocked === 'function') {
             isUnlocked = await provider._metamask.isUnlocked();
           }
           
           // Si el store asume conexión (address) pero el ping real devuelve [] O el API isUnlocked=false
           if (isMounted && (!isUnlocked || !accounts || accounts.length === 0)) {
              console.log("[Auth - Híbrido] Watchdog detected Locked Context (Silenced Log Out)");
              setIsLoggingOut(true);
              resetWalletState(); // Limpiar Estado Global
              window.location.href = '/'; // Redirección Forzada
           }
        }
      } catch (error) {
         // Fallback silencioso en caso de red inestable o provider proxy defectuoso
      }
    }, 2000); // Polling ligero (2s)

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [address, connector, resetWalletState]);

  // Wagmi sync logic
  useEffect(() => {
    if (!hasHydrated) return;
    
    // Si Wagmi dice que estamos desconectados definitivamente, forzamos salida
    // PERO solo si no estamos ya en medio de una desconexión optimista
    if (wagmiStatus === 'disconnected' && address && !isOptimisticUI_Disconnected) {
      console.log("[Auth] Wagmi disconnected. Clearing session and redirecting...");
      setIsLoggingOut(true);
      resetWalletState();
      window.location.href = '/';
      return;
    }

    // Sincronizar dirección activa de Wagmi al Store
    // REGLA CRÍTICA: No resincronizar si estamos en medio de una desconexión optimista
    if (isConnected && wagmiAddress && !isLoggingOut && !isOptimisticUI_Disconnected) {
      if (wagmiAddress !== address) {
        console.log("[Auth] Updating store address to match Wagmi:", wagmiAddress);
        setAddress(wagmiAddress);
      }
    }
  }, [isConnected, wagmiAddress, wagmiStatus, setAddress, resetWalletState, address, hasHydrated, isLoggingOut, isOptimisticUI_Disconnected]);

  // --- Blockchain Time Heartbeat ---
  // Sincroniza el tiempo de la dApp con el último bloque cada 5 segundos.
  // Esto es CRÍTICO en redes locales para que los Time-locks se habiliten solos.
  useEffect(() => {
    if (!isConnected) return;

    const updateTimeFromBlock = async () => {
      try {
        const provider = ((connector && typeof connector.getProvider === 'function') 
          ? await connector.getProvider() 
          : (typeof window !== 'undefined' ? (window as any).ethereum : null)) as MetaMaskProvider | null;
        
        if (provider && typeof provider.request === 'function') {
          const block = await provider.request({ 
            method: 'eth_getBlockByNumber', 
            params: ['latest', false] 
          });
          
          if (block && block.timestamp) {
            const newTime = parseInt(block.timestamp, 16);
            if (newTime !== blockchainTime) {
              console.log(`[DAO] Syncing Blockchain Time: ${new Date(newTime * 1000).toLocaleString()}`);
              setBlockchainTime(newTime);
            }
          }
        }
      } catch (err) {
        console.warn("[DAO] Failed to sync block time:", err);
      }
    };

    // Actualización inicial
    updateTimeFromBlock();

    // Polling cada 2 segundos para máxima precisión en Time-locks
    const timeInterval = setInterval(updateTimeFromBlock, 2000);

    return () => clearInterval(timeInterval);
  }, [isConnected, connector, blockchainTime, setBlockchainTime]);

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modals Local State (UI only)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Si nos volvemos a conectar de verdad en el futuro, blanqueamos este estado
  // Usamos isLoggingOut como guardia para evitar que se resetee durante el logout
  useEffect(() => {
    if (address && !isLoggingOut) {
      setIsOptimisticUI_Disconnected(false);
      setIsDropdownClosingInstantly(false);
    }
  }, [address, isLoggingOut]);

  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [isExecutionSuccessModalOpen, setIsExecutionSuccessModalOpen] = useState(false);

  // Derived selected proposal from store to ensure it's always fresh
  const proposalDetail = useMemo(() => {
    if (selectedProposalId === null) return null;
    return proposals.find(p => p.id === selectedProposalId) || null;
  }, [selectedProposalId, proposals]);
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [isEmptyTreasuryModalOpen, setIsEmptyTreasuryModalOpen] = useState(false);
  const [isVotingPowerModalOpen, setIsVotingPowerModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExecutingProposal, setIsExecutingProposal] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All Proposals');
  const [selectedSort, setSelectedSort] = useState('Descending');
  const [filterType, setFilterType] = useState<'all' | 'mine' | 'others'>('all');
  const [showOnlyMine, setShowOnlyMine] = useState(false); // Legacy sync if needed, but we'll use filterType now
  
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const lastAddrRef = useRef<string | null>(address);
  useEffect(() => {
    if (address !== lastAddrRef.current) {
      console.log("[DAO] Wallet change detected! Resetting filters...");
      lastAddrRef.current = address;
      
      // Reset all interactive states
      setFilterType('all');
      setShowOnlyMine(false);
      setSearchQuery('');
      setSelectedFilter('All Proposals');
      setSelectedSort('Descending');
      setCurrentPage(1);
      
      // Close dropdowns
      setIsFilterOpen(false);
      setIsSortOpen(false);
      setIsWalletOpen(false);
    }
  }, [address]);
  
  // Header display logic: Strict UI dependency on local store state
  const headerContent = useMemo(() => {
    const tHeader = performance.now();
    console.log('[HEADER] render:', { hasHydrated, isInitializing, isOptimisticUI_Disconnected, address });
    
    if (!hasHydrated || isInitializing) {
      return (
        <span className="flex items-center gap-1 text-slate-400 justify-end w-[240px] shrink-0">
          <Loader2 className="size-3 animate-spin" />
          <span>Checking...</span>
        </span>
      );
    }
    
    // UI REAKTIVA INMEDIATA: Este estado local se levanta primero y
    // esquiva la cascada de renders globales de React al hacer logout.
    if (isOptimisticUI_Disconnected) {
      console.log(`[HEADER] Showing "Not Connected" (optimistic) at ${Math.round(tHeader)}ms`);
      return <span className="w-[240px] text-right shrink-0">Not Connected</span>;
    }

    if (address) {
      return (
        <span className="w-[240px] text-right shrink-0">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      );
    }
    
    return (
      <span className="w-[240px] text-right shrink-0">Not Connected</span>
    );
  }, [hasHydrated, isInitializing, address, isOptimisticUI_Disconnected]);

  useEffect(() => {
    // Protection: Only redirect if we are SURE there is no session
    const isReallyConnected = isConnected && wagmiAddress;
    
    if (!isReallyConnected && !storeIsConnecting && !isInitializing && !isLoggingOut && wagmiStatus === 'disconnected') {
      console.log("[Auth] No active session found. Redirecting to landing.");
      window.location.href = '/';
    }
  }, [storeIsConnecting, wagmiStatus, isInitializing, isLoggingOut, isConnected, wagmiAddress]);

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsWalletOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(target)) {
        setIsSortOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  const handleDisconnect = () => {
    const t0 = performance.now();
    console.log('[DISCONNECT] Clicked! Setting states...');
    
    // 1. UI OPTIMISTA INMEDIATA
    setIsDropdownClosingInstantly(true);
    setIsOptimisticUI_Disconnected(true);
    setIsWalletOpen(false);
    setIsLoggingOut(true);
    
    const t1 = performance.now();
    console.log(`[DISCONNECT] States set in ${Math.round(t1 - t0)}ms. Waiting for paint...`);
    
    // 2. Esperar a que el browser pinte el estado antes de redirigir
    // requestAnimationFrame asegura que el cambio visual se haya pintado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        console.log('[DISCONNECT] Paint confirmed. Redirecting...');
        window.location.href = '/';
      });
    });
    
    // 3. Background cleanup - El usuario ya se fue
    setTimeout(async () => {
      resetWalletState();
      
      try {
        disconnect();
        try { wagmiDisconnect(); } catch(e) {}
        
        // DEEP CACHE PURGE
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('wagmi.store');
          window.localStorage.removeItem('wagmi.cache');
        }
        
        // Intento EIP-2255: Forzar a MetaMask a destruir la autorización
        const eth = (typeof window !== 'undefined' ? (window as any).ethereum : null) as MetaMaskProvider | null;
        if (eth && eth.request) {
          await eth.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          });
        }
      } catch (err) {
        console.log("Background disconnect error", err);
      }
    }, 0);
  };

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

  const { writeContract, writeContractAsync, data: txHash, isPending: isSigning, isError: isSigningError, reset: resetWrite } = useWriteContract();
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    isError: isConfirmingError,
    status: txStatus,
    error: txDetailedError
  } = useWaitForTransactionReceipt({ 
    hash: txHash || (gaslessStatus === 'confirming' && gaslessHash ? (gaslessHash as `0x${string}`) : undefined) 
  });

  // Track the actual mining process
  useEffect(() => {
    if (txHash || (gaslessStatus === 'confirming' && gaslessHash)) {
      const activeHash = txHash || gaslessHash;
      console.log(`[VOTE] Mining State: Hash=${activeHash?.substring(0, 10)}... Status=${txStatus} isConfirming=${isConfirming} isConfirmed=${isConfirmed}`);
      
      if (isConfirmingError) {
        console.error("[VOTE] Transaction Failed on Chain:", txDetailedError);
      }
    }
  }, [txHash, gaslessHash, gaslessStatus, isConfirming, isConfirmed, txStatus, txDetailedError]);

  // Special sync for gaslessHash as well
  useEffect(() => {
    // If we're confirming a gasless tx, and isConfirmed is true, set status to success
    if (gaslessStatus === 'confirming' && isConfirmed) {
      console.log("[DAO] Gasless Transaction confirmed! Finalizing status...");
      setGaslessStatus('success');
      queryClient.invalidateQueries();
    }
  }, [gaslessStatus, isConfirmed, queryClient, setGaslessStatus]);

  // Force refetch when any local transaction (like voting) completes
  useEffect(() => {
    if (isConfirmed) {
      console.log("[DAO] Transaction confirmed! Invalidating queries for fresh data...");
      queryClient.invalidateQueries();
    }
  }, [isConfirmed, queryClient]);

  const [votingOption, setVotingOption] = useState<'FOR' | 'AGAINST' | 'ABSTAIN' | null>(null);

  // Sync: Keep modal open until the UI actually reflects the vote
  useEffect(() => {
    if (!votingOption || !proposalDetail) return;
    
    const optionMap = { 'ABSTAIN': 0, 'FOR': 1, 'AGAINST': 2 };
    const isVotedInState = proposalDetail.userVote === optionMap[votingOption];

    // Reset if:
    // 1. Proposal state already updated (mined)
    // 2. OR Transaction failed
    // 3. OR Wagmi confirms mining (isConfirmed)
    if (isVotedInState || (isConfirmed && !isSigning && !isConfirming) || isSigningError || isConfirmingError || gaslessStatus === 'error') {
      console.log(`[VOTE] TERMINAL STATE reached for Proposal #${proposalDetail.id}. Result in state: ${isVotedInState}, Confirmed: ${isConfirmed}, Error: ${isConfirmingError}. Closing overlay.`);
      setVotingOption(null);
      // Clean up states
      resetWrite();
      if (gaslessStatus === 'success' || gaslessStatus === 'error') resetGasless();
    }
  }, [proposalDetail?.userVote, votingOption, isSigning, isConfirming, isConfirmed, proposalDetail, isSigningError, isConfirmingError, gaslessStatus, resetWrite, resetGasless]);

  const handleVote = async (voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    if (!proposalDetail || isSigning || isConfirming || isGaslessProcessing) {
      console.log(`[VOTE] Aborting vote for Proposal #${proposalDetail?.id} (Option: ${voteType}). Reason: Already processing or no proposal selected.`);
      return;
    }
    
    console.log(`[VOTE] Initiating vote for Proposal #${proposalDetail.id} | Option: ${voteType}`);

    // Explicit network check for direct voting
    if (isWrongNetwork && !isGaslessEnabled) {
      console.log("[VOTE] Wrong network detected for direct vote. Attempting to switch chain.");
      switchChain({ chainId: 31337 });
      return;
    }

    if (userDeposit <= 0) {
      console.log("[VOTE] User has no voting power. Opening voting power modal.");
      setIsVotingPowerModalOpen(true);
      return;
    }

    // --- Network Check ---
    const currentChainId = queryClient.getQueryData(['chainId']); 
    // Actually using wagmi's useChainId is better
    
    setVotingOption(voteType);

    const optionMap = { 'ABSTAIN': 0, 'FOR': 1, 'AGAINST': 2 };
    const calldata = encodeFunctionData({
      abi: DAOVotingABI,
      functionName: 'vote',
      args: [BigInt(proposalDetail.id), optionMap[voteType]],
    });

    if (isGaslessEnabled) {
      console.log(`[VOTE] >>> STARTING GASLESS VOTE on Proposal #${proposalDetail.id} | Option: ${voteType}`);
      await executeGasless(DAO_ADDRESS, calldata);
    } else {
      console.log(`[VOTE] >>> STARTING DIRECT VOTE on Proposal #${proposalDetail.id} | Option: ${voteType}`);
      try {
        const hash = await writeContractAsync({
          address: DAO_ADDRESS,
          abi: DAOVotingABI,
          functionName: 'vote',
          args: [BigInt(proposalDetail.id), optionMap[voteType]],
        });
        console.log(`[VOTE] Wallet signature successful! Hash: ${hash}. Waiting for mining...`);
      } catch (err: any) {
        const isUserRejected = err?.message?.toLowerCase().includes('user rejected') || 
                               err?.message?.toLowerCase().includes('rejected') || 
                               err?.code === 4001;
        if (isUserRejected) {
          console.log(`[VOTE] User cancelled vote for Proposal #${proposalDetail.id}`);
        } else {
          console.error(`[VOTE] Transaction failed for Proposal #${proposalDetail.id}:`, err);
        }
        setVotingOption(null);
        resetWrite();
      }
    }
  };


  const handleExecute = async () => {
    if (!proposalDetail || isExecutingProposal) return;
    
    console.log(`[EXECUTE] Initiating execution for Proposal #${proposalDetail.id} | Gasless: ${isGaslessEnabled}`);
    setIsExecutingProposal(true);

    const calldata = encodeFunctionData({
      abi: DAOVotingABI,
      functionName: 'executeProposal',
      args: [BigInt(proposalDetail.id)],
    });

    try {
      if (isGaslessEnabled) {
        await executeGasless(DAO_ADDRESS, calldata);
      } else {
        await writeContractAsync({
          address: DAO_ADDRESS,
          abi: DAOVotingABI,
          functionName: 'executeProposal',
          args: [BigInt(proposalDetail.id)],
        });
      }
      console.log(`[EXECUTE] Command submitted for Proposal #${proposalDetail.id}`);
      setIsExecutionSuccessModalOpen(true);
    } catch (err: any) {
      const isUserRejected = err?.message?.toLowerCase().includes('user rejected') || 
                             err?.message?.toLowerCase().includes('rejected') || 
                             err?.code === 4001;
      if (isUserRejected) {
        console.log(`[EXECUTE] User cancelled execution for Proposal #${proposalDetail.id}`);
      } else {
        console.error(`[EXECUTE] Failed for Proposal #${proposalDetail.id}:`, err);
      }
      resetWrite();
    } finally {
      setIsExecutingProposal(false);
    }
  };

  const handleStartProposalFlow = () => {
    if (totalDeposited === 0) {
      setIsEmptyTreasuryModalOpen(true);
    } else if (votingPower < 0.01) {
      setIsVotingPowerModalOpen(true);
    } else {
      setIsNewProposalModalOpen(true);
    }
  };

  const handleTransitionToDeposit = () => {
    setIsEmptyTreasuryModalOpen(false);
    // Slight delay for smooth transition
    setTimeout(() => {
      setIsDepositModalOpen(true);
    }, 300);
  };

  return (
    <div className="min-h-screen text-slate-900 font-body flex flex-col relative bg-[#F5F6F4]">
      {/* Wrong Network Banner */}
      <AnimatePresence>
        {isWrongNetwork && isConnected && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white px-12 py-2 flex items-center justify-between z-[60] shadow-md border-b border-amber-600"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-5 animate-pulse" />
              <p className="text-sm font-bold">
                Wrong Network Detected! Please switch to <span className="underline decoration-white/50">Foundry (31337)</span> to see your funds and interact.
              </p>
            </div>
            <button 
              onClick={() => switchChain({ chainId: 31337 })}
              className="px-4 py-1 bg-white text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors shadow-sm"
            >
              Switch Network
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="shrink-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-12 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-green text-primary hover:opacity-90 transition-opacity">
            <Landmark className="size-5" />
          </Link>
          <h1 className="font-display text-xl font-bold tracking-tight">DAO Governance</h1>
        </div>
        <div className="flex items-center gap-3">
          <GaslessToggle />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsWalletOpen(!isWalletOpen)}
              className={`flex flex-col items-end hover:bg-slate-50 px-3 py-1.5 -mr-3 rounded-lg active:scale-[0.98] text-right cursor-pointer min-w-[260px] h-[46px] justify-center ${isDropdownClosingInstantly ? '' : 'transition-all duration-200'}`}
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Wallet Status</span>
              <div className="text-sm font-semibold flex items-center gap-1.5 justify-end w-full leading-none">
                {headerContent}
                <ChevronDown className={`size-4 shrink-0 ${isWalletOpen ? 'rotate-180' : ''} ${isDropdownClosingInstantly ? '' : 'transition-transform duration-200'}`} />
              </div>
            </button>

            <AnimatePresence>
              {isWalletOpen && (
                <motion.div
                  key="wallet-dropdown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: isDropdownClosingInstantly ? 0 : 0.2 }}
                  className="absolute right-0 top-full mt-4 w-72 bg-white rounded-2xl shadow-lg ring-1 ring-slate-900/5 overflow-hidden"
                >
                  {/* Top Section */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Wallet</span>
                      <span className="text-xs font-bold text-dark-green bg-primary/20 px-2.5 py-1 rounded-md">Anvil Network</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-dark-green text-primary flex items-center justify-center shadow-inner">
                        <Wallet className="size-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-deep-black text-lg leading-tight">Wallet 1</h3>
                        <p className="text-slate-500 text-sm mt-0.5 font-semibold">
                          {balance ? `${parseFloat(formatEther(balance.value)).toFixed(3)} ${balance.symbol}` : '0.000 ETH'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {/* Actions Section */}
                  <div className="p-3">
                    <button 
                      onClick={handleCopyAddress}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all duration-200 active:scale-[0.98] text-left group cursor-pointer"
                    >
                      <div className="size-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                        <Copy className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {copied ? <span className="text-dark-green font-bold">Copied!</span> : 'Copy Address'}
                        </p>
                        <p className="text-xs font-mono text-deep-black mt-0.5">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
                        </p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={handleDisconnect}
                      className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-all duration-200 active:scale-[0.98] text-left mt-1 group cursor-pointer"
                    >
                      <div className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-all border border-transparent group-hover:border-red-200">
                        <LogOut className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-deep-black group-hover:text-red-700 transition-colors">Disconnect</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col min-h-0">
        {/* Main Content */}
        <main className="mx-auto w-full max-w-[1200px] flex-1 p-12 shrink-0">
        {proposalDetail ? (
          /* Proposal Detail View */
          <ProposalDetail
            proposal={proposalDetail}
            onBack={() => setSelectedProposalId(null)}
            onVote={handleVote}
            votingChoice={votingOption}
            onExecute={handleExecute}
            isExecuting={isExecutingProposal || isGaslessProcessing}
          />
        ) : (
          <>
            {/* Governance Overview Section */}
        <section className="mb-8">
          <div className="mb-5">
            <h3 className="font-display text-2xl font-bold text-slate-900 mb-1.5">Your Governance Overview</h3>
            <p className="text-sm text-slate-600">Monitor your treasury balance, voting power, and governance participation.</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <TreasuryCard
              icon={Wallet}
              title="Treasury Balance"
              value={totalDeposited}
              unit="ETH"
              onAction={() => setIsDepositModalOpen(true)}
              animateValue
            />

            <GovernanceCard
              icon={PieChart}
              title="My Voting Power"
              value={formatPercentage(votingPower)}
            />

            <GovernanceCard
              icon={FileText}
              title="Total Proposals"
              value={proposals.length}
            />

            <GovernanceCard
              icon={ThumbsUp}
              title="My Votes"
              value={proposals.filter(p => p.userVote !== null).length.toString()}
            />
          </div>
        </section>

        {/* Active Proposals Section */}
          <ProposalsList
            proposals={proposals}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            isSortOpen={isSortOpen}
            setIsSortOpen={setIsSortOpen}
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
            filterType={filterType}
            setFilterType={setFilterType}
            userAddress={address}
            onNewProposal={handleStartProposalFlow}
            onSelectProposal={(p) => setSelectedProposalId(p.id)}
            filterRef={filterRef}
            sortRef={sortRef}
            blockchainTime={blockchainTime}
          />
        </>
        )}
      </main>

      {/* Minimal App Footer */}
      <footer className="mt-auto shrink-0 border-t border-slate-200 bg-transparent py-6 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          <div className="w-full md:w-1/3 flex justify-center md:justify-start text-center md:text-left">
            <p>© 2026 DAO GASLESS</p>
          </div>
          
          <div className="w-full md:w-1/3 flex justify-center items-center gap-8">
            <a href="https://www.linkedin.com/in/reneorellana" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-slate-600 transition-colors group">
              <div className="flex items-center justify-center size-6 rounded-full border border-slate-200/60 bg-slate-50 shadow-sm group-hover:border-slate-300 group-hover:bg-slate-100 transition-all">
                <Linkedin className="size-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">LinkedIn</span>
            </a>
          </div>

          <div className="w-full md:w-1/3 flex justify-center md:justify-end">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em]">
              Designed by René <span className="text-sm">😎</span>
            </p>
          </div>
        </div>
      </footer>

      </div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />

      <EmptyTreasuryModal
        isOpen={isEmptyTreasuryModalOpen}
        onClose={() => setIsEmptyTreasuryModalOpen(false)}
        onDeposit={handleTransitionToDeposit}
      />

      <NewProposalModal
        isOpen={isNewProposalModalOpen}
        onClose={() => setIsNewProposalModalOpen(false)}
      />

      <VotingPowerAlertModal
        isOpen={isVotingPowerModalOpen}
        onClose={() => setIsVotingPowerModalOpen(false)}
        userDeposit={userDeposit}
        onDeposit={() => {
          setIsVotingPowerModalOpen(false);
          // Standard transition with reset
          resetWrite();
          resetGasless();
          setTimeout(() => setIsDepositModalOpen(true), 300);
        }}
      />
      {/* Vote Processing Overlay (Standard) */}
      <AnimatePresence mode="wait">
        {(isSigning || isConfirming) && !isGaslessProcessing && !isExecutionSuccessModalOpen && (
          <motion.div 
            key="vote-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-green/40 backdrop-blur-[2px] cursor-wait"
          >
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-[320px] animate-in zoom-in-95 duration-200">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Loader2 className="size-8 text-primary animate-spin" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Processing Vote</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {isSigning ? 'Please confirm in your wallet...' : 'Confirming on the blockchain...'}
              </p>
              
              <div className="mt-6 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Transaction Pending</span>
              </div>
            </div>
          </motion.div>
        )}

        {isGaslessProcessing && (
          <GaslessOverlay 
            status={gaslessStatus}
            error={gaslessError}
            txHash={gaslessHash}
            onCancel={() => {
              resetGasless();
              setVotingOption(null);
            }}
            onProceedDirect={proceedDirectlyGasless}
          />
        )}
        
        {isExecutionSuccessModalOpen && proposalDetail && (
          <motion.div 
            key="execution-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-dark-green/40 backdrop-blur-[4px]"
          >
            <motion.div 
              key="execution-success-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-[420px] w-full mx-4"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75"></div>
                <div className="relative size-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white shadow-sm" style={{ backgroundColor: 'rgba(212, 255, 12, 0.2)' }}>
                  <div className="size-12 rounded-full bg-primary flex items-center justify-center text-dark-green shadow-md">
                    <Check className="size-6 stroke-[3]" />
                  </div>
                </div>
              </div>
              
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Execution Successful!</h2>
              <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8">
                The proposal has been successfully executed. <span className="font-bold text-slate-900">{proposalDetail.amount.toFixed(2)} ETH</span> has been transferred to the recipient.
              </p>

              <div className="w-full space-y-3 mb-2">
                <div className="flex justify-between items-center p-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Executed
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                  <span className="text-sm font-bold text-slate-900">{proposalDetail.amount.toFixed(2)} ETH</span>
                </div>
                <div className="flex justify-between items-center p-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipient</span>
                  <span className="text-xs font-mono font-bold text-slate-600 truncate max-w-[180px]">{proposalDetail.recipient}</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setIsExecutionSuccessModalOpen(false);
                  setSelectedProposalId(null);
                }}
                className="w-full mt-6 h-12 bg-dark-green hover:bg-[#05462b] text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-dark-green/20 cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
