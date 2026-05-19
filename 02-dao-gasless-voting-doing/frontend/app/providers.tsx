'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/web3/config'

import { Web3DataSync } from '@/components/Web3DataSync'
import { GaslessProvider } from '@/context/GaslessContext'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <GaslessProvider>
          <Web3DataSync />
          {children}
        </GaslessProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
