'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ConnectionErrorModal } from './ConnectionErrorModal'
import { useWeb3 } from '../../hooks/useWeb3'
import { usePathname, useRouter } from 'next/navigation'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isSepolia, address, walletStatus, disconnect } = useWeb3()
  const pathname = usePathname()
  const router = useRouter()

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (e.currentTarget.scrollTop > 10) {
      setIsScrolled(true)
    } else {
      setIsScrolled(false)
    }
  }

  // Global Route Guard: Redirection logic
  useEffect(() => {
    // If we are on ANY page other than the Root (SelectWalletPage)
    if (pathname !== '/') {
      const isNotSepolia = !isSepolia && walletStatus !== 'idle';
      const isManualDisconnect = !address && walletStatus !== 'connecting';
      
      if (isNotSepolia || isManualDisconnect) {
        console.log("Global Guard Trace: Access Invalid. Redirecting to Portal.");
        // If it's a network mismatch, explicitly trigger a disconnect to clear state
        if (isNotSepolia) disconnect();
        router.push('/');
      }
    }
  }, [isSepolia, address, walletStatus, pathname, router, disconnect]);

  return (
    <div className="bg-sky-50 dark:bg-[#020617] font-display text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex selection:bg-primary/20 selection:text-primary transition-colors duration-300">
      <ConnectionErrorModal />
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-w-0">
        <Topbar isScrolled={isScrolled} />
        <main 
          className="flex-1 overflow-y-auto overflow-x-auto p-10 pb-24 min-w-0 custom-scrollbar"
          onScroll={handleScroll}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
