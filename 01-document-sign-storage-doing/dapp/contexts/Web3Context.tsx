'use client'

import { createContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'
import { BrowserProvider, Signer, formatEther } from 'ethers'

export type WalletStatus = 'idle' | 'unavailable' | 'disconnected' | 'connecting' | 'connected' | 'wrong_network'

interface Web3ContextState {
  provider: BrowserProvider | null
  signer: Signer | null
  address: string | null
  balanceEth: string | null
  chainId: number | null
  walletStatus: WalletStatus
  isSepolia: boolean
  isConnected: boolean
  hasWallet: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  clearError: () => void
}

export const Web3Context = createContext<Web3ContextState>({
  provider: null,
  signer: null,
  address: null,
  balanceEth: null,
  chainId: null,
  walletStatus: 'idle',
  isSepolia: false,
  isConnected: false,
  hasWallet: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  clearError: () => {},
})

const TARGET_CHAIN_ID = 11155111 // Sepolia

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<Signer | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [balanceEth, setBalanceEth] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const updateState = useCallback(async (browserProvider: BrowserProvider) => {
    console.log("Web3Context: [Sync] Updating state details...");
    try {
      // 1. Get signer and address first (Infrastructure agnostic)
      const signerInstance = await browserProvider.getSigner();
      const currentAddress = await signerInstance.getAddress();
      const balance = await browserProvider.getBalance(currentAddress);
      
      console.log("Web3Context: [Sync] Identity found:", currentAddress);
      setSigner(signerInstance);
      setAddress(currentAddress);
      setBalanceEth(formatEther(balance));

      // 2. Network Check (Session active, but network might be invalid)
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      const isSepolia = currentChainId === TARGET_CHAIN_ID;
      
      if (!isSepolia) {
        console.warn("Web3Context: [Sync] Network mismatch detected.");
        setWalletStatus('wrong_network');
        setError(null);
        return;
      }

      // 3. Fully Connected on Target Network
      console.log("Web3Context: [Sync] Sepolia Verified.");
      setWalletStatus('connected');
      setError(null);
    } catch (err: any) {
      console.warn('Web3 Graceful Recovery:', err.message);
      
      // If it's a "Failed to fetch" or similar RPC/Network error, handle it cleanly.
      const isNetworkError = err.message?.toLowerCase().includes('fetch') || 
                             err.message?.toLowerCase().includes('network');
      
      if (isNetworkError) {
        // Just say we are disconnected, no scary technical details in the UI
        setWalletStatus('disconnected');
        setError('Network connectivity issue. Please check your provider or switch back to Sepolia.');
      } else {
        setError('An unexpected error occurred while updating wallet state.');
        setWalletStatus('disconnected');
      }
    }
  }, []);

  // Initialization: Check if ethereum exists
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const checkNetworkAndStatus = async () => {
        try {
          // Re-instantiate provider to ensure fresh state
          const browserProvider = new BrowserProvider((window as any).ethereum)
          setProvider(browserProvider)

          // Get fresh chain ID directly from the provider or RPC
          const hexChainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
          const currentId = parseInt(hexChainId, 16)
          setChainId(currentId)

          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
          
          if (currentId !== TARGET_CHAIN_ID) {
            setWalletStatus('wrong_network')
          } else if (accounts.length > 0) {
            // If on correct network and has accounts, update full state
            await updateState(browserProvider)
          } else {
            setWalletStatus('disconnected')
            setAddress(null)
          }
        } catch (err) {
          console.error("Web3 Check Error:", err)
          setWalletStatus('disconnected')
        }
      }

      // Initial check
      checkNetworkAndStatus()

      const handleChainChanged = (newChainId: string) => {
        console.log('Web3 Event: chainChanged', newChainId)
        checkNetworkAndStatus()
      }

      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Web3 Event: accountsChanged', accounts)
        checkNetworkAndStatus()
      }

      const handleDisconnect = (error: any) => {
        console.log('Web3 Event: disconnect', error)
        setWalletStatus('disconnected')
        setAddress(null)
      }

      if ((window as any).ethereum.on) {
        ;(window as any).ethereum.on('chainChanged', handleChainChanged)
        ;(window as any).ethereum.on('accountsChanged', handleAccountsChanged)
        ;(window as any).ethereum.on('disconnect', handleDisconnect)
      }

      return () => {
        if ((window as any).ethereum.removeListener) {
          ;(window as any).ethereum.removeListener('chainChanged', handleChainChanged)
          ;(window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged)
          ;(window as any).ethereum.removeListener('disconnect', handleDisconnect)
        }
      }
    } else {
      setWalletStatus('unavailable')
    }
  }, [updateState]);

  const connect = useCallback(async () => {
    console.log("Web3Context: [1/4] Starting connect() procedure...");
    
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      console.error("Web3Context: [Error] No ethereum provider detected in window.");
      setWalletStatus('unavailable');
      return;
    }

    setWalletStatus('connecting');
    try {
      const eth = (window as any).ethereum;
      console.log("Web3Context: [2/4] Provider detected. Requesting accounts...");
      
      const accounts = await eth.request({ method: 'eth_requestAccounts' })
        .catch((err: any) => {
          console.error("Web3Context: [Request Error] User rejected or RPC failed:", err);
          if (err.code === 4001) throw new Error('User rejected connection');
          throw err;
        });

      console.log("Web3Context: [3/4] Accounts received:", accounts);
      
      const browserProvider = new BrowserProvider(eth);
      setProvider(browserProvider);
      
      console.log("Web3Context: [4/4] Instantiating provider and updating state...");
      await updateState(browserProvider);
      
      console.log("Web3Context: [Success] Connection flow complete.");
    } catch (err: any) {
      console.error('Web3Context: [Fatal Error] Connection failed:', err);
      setError(
        err.message?.includes('User rejected') 
          ? 'The connection request was denied. Please accept the request in your wallet.' 
          : 'Authentication failed. Please verify your wallet is set to Sepolia and your provider is active.'
      );
      setWalletStatus('disconnected');
    }
  }, [updateState])

  const disconnect = useCallback(async () => {
    setSigner(null)
    setAddress(null)
    setBalanceEth(null)
    setError(null)

    // Re-evaluate wallet status based on the RETAINED chainId
    // Fetch fresh chainId to be absolutely sure
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const hexChainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
        const currentId = parseInt(hexChainId, 16)
        setChainId(currentId)
        
        if (currentId !== TARGET_CHAIN_ID) {
          setWalletStatus('wrong_network')
        } else {
          setWalletStatus('disconnected')
        }
      } catch (e) {
        setWalletStatus('disconnected')
      }
    } else {
      setWalletStatus('disconnected')
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const isConnected = walletStatus === 'connected' || walletStatus === 'wrong_network'
  const isSepolia = chainId === TARGET_CHAIN_ID
  const hasWallet = walletStatus !== 'unavailable' && walletStatus !== 'idle'

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        address,
        balanceEth,
        chainId,
        walletStatus,
        isSepolia,
        isConnected,
        hasWallet,
        error,
        connect,
        disconnect,
        clearError
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}
