'use client'

import { ThemeProvider } from 'next-themes'
import { Web3Provider } from '../contexts/Web3Context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Web3Provider>
        {children}
      </Web3Provider>
    </ThemeProvider>
  )
}
