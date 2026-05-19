'use client'

import { useMemo } from 'react'
import { Contract, Interface } from 'ethers'
import { useWeb3 } from './useWeb3'
import documentRegistryAbi from '../contracts/DocumentRegistry.json'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export function useDocumentRegistry() {
  const { signer, provider, isConnected } = useWeb3()

  const contract = useMemo(() => {
    if (!isConnected || !provider) return null

    // We use signer if available (for write operations), 
    // otherwise fallback to provider (for read-only)
    const target = signer || provider
    
    try {
      // documentRegistryAbi is the ABI array directly in this project
      return new Contract(
        CONTRACT_ADDRESS,
        documentRegistryAbi,
        target
      )
    } catch (err) {
      console.error('Failed to initialize DocumentRegistry contract:', err)
      return null
    }
  }, [isConnected, signer, provider])

  return contract
}
