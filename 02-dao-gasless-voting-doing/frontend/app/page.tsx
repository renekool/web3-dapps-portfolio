'use client';

import React, { useState } from 'react';
import { Landmark, ShieldCheck, Shield, Fingerprint, Lock, Zap, PenTool, MousePointerClick, Share2, Globe, Code, FileText, Fuel, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { FeatureCard } from '@/components/FeatureCard';


import { useDAOStore } from '@/lib/store/useDAOStore';


import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { setAddress, isInitializing, setInitializing, resetWalletState } = useDAOStore();
  const { connect, isPending: isConnecting } = useConnect();
  const { address, isConnected, status: wagmiStatus } = useAccount();
  const { disconnect } = useDisconnect();

  // Manage initialization state based on Wagmi
  useEffect(() => {
    const isWagmiLoading = wagmiStatus === 'reconnecting' || wagmiStatus === 'connecting';
    if (!isWagmiLoading) {
      setInitializing(false);
    }
  }, [wagmiStatus, setInitializing]);

  // Sync Wagmi account with Zustand store
  useEffect(() => {
    const verifyAndSync = async () => {
      if (!isInitializing && isConnected && address) {
        // Truco Anti-Fake Cache: Wagmi dice que estamos conectados, pero ¿está MetaMask realmente desbloqueado?
        let isReallyUnlocked = true;
        if (typeof window !== 'undefined' && (window as any).ethereum?._metamask?.isUnlocked) {
          isReallyUnlocked = await (window as any).ethereum._metamask.isUnlocked();
        }

        if (isReallyUnlocked) {
           console.log(`Session active for: ${address}`);
           setAddress(address);
           router.push('/dao');
        } else {
           console.log("Wagmi cache is stale. MetaMask is actually Locked. Purging ghost session...");
           try { disconnect(); } catch(e) {}
           if (typeof window !== 'undefined') {
             window.localStorage.removeItem('wagmi.store');
             window.localStorage.removeItem('wagmi.cache');
           }
           setAddress(null);
        }
      } else if (!isInitializing) {
        setAddress(null);
      }
    };
    verifyAndSync();
  }, [isConnected, address, setAddress, router, isInitializing, disconnect]);

  // Track which button initiated the connection
  const [activeButton, setActiveButton] = useState<'header' | 'hero' | 'cta' | null>(null);

  const handleConnect = async (buttonId: 'header' | 'hero' | 'cta') => {
    if (isConnected && address) {
      // Re-verificar la verdad real antes de saltar por inercia
      let isReallyUnlocked = true;
      if (typeof window !== 'undefined' && (window as any).ethereum?._metamask?.isUnlocked) {
        isReallyUnlocked = await (window as any).ethereum._metamask.isUnlocked();
      }

      if (isReallyUnlocked) {
        console.log("Existing session found, navigating to dashboard...");
        router.push('/dao');
        return;
      }
      // Si la caché mintió, la destrozamos en silencio para obligar al eth_requestAccounts
      disconnect();
    }

    setActiveButton(buttonId);
    console.log(`Initiating connection from: ${buttonId}`);
    try { disconnect() } catch(e) {} // Ensure Wagmi is clean
    resetWalletState(); // Ensure Store is clean
    try {
      connect({ connector: injected() }, {
        onSuccess: () => {
          console.log("Connect successful");
          router.push('/dao');
        },
        onError: () => {
          setActiveButton(null);
        }
      });
    } catch (error) {
      console.error("Connection error:", error);
      setActiveButton(null);
    }
  };

  // Clear activeButton when connection completes or Wagmi finishes
  useEffect(() => {
    if (!isConnecting && activeButton) {
      // Keep it set briefly if we're about to redirect
      if (!isConnected) {
        setActiveButton(null);
      }
    }
  }, [isConnecting, isConnected, activeButton]);

  return (
    <div className="bg-background-light text-slate-900 overflow-x-hidden font-body">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-soft-gray px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto w-full h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-dark-green rounded flex items-center justify-center text-primary">
              <Landmark className="size-5" />
            </div>
            <h2 className="text-deep-black text-xl font-bold tracking-tight font-display">DAO GASLESS</h2>
          </div>
          <button 
            onClick={() => handleConnect('header')}
            disabled={isConnecting || isInitializing}
            className="flex min-w-[140px] items-center justify-center rounded-lg h-11 px-6 bg-dark-green text-white text-sm font-bold transition-all duration-200 hover:bg-opacity-90 hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 cursor-pointer"
          >
            {activeButton === 'header' && isConnecting ? <Loader2 className="size-4 animate-spin" /> : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center px-4 md:px-8 py-24 bg-gradient-to-b from-white to-background-light overflow-hidden">
          {/* Floating Avatars */}
          <div className="absolute inset-0 max-w-[1200px] mx-auto pointer-events-none z-0 hidden sm:block">
            {/* Top Left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.1 },
                scale: { duration: 0.8, delay: 0.1, type: "spring" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.1 } 
              }}
              className="absolute top-[12%] left-[2%] md:left-[8%] w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-[0_0_40px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <img src="https://i.pravatar.cc/150?img=32" alt="User" className="w-full h-full object-cover" />
            </motion.div>

            {/* Top Right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.3 },
                scale: { duration: 0.8, delay: 0.3, type: "spring" },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 } 
              }}
              className="absolute top-[10%] right-[2%] md:right-[8%] w-14 h-14 md:w-16 md:h-16 rounded-full border-4 border-white shadow-[0_0_40px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <img src="https://i.pravatar.cc/150?img=12" alt="User" className="w-full h-full object-cover" />
            </motion.div>

            {/* Mid Left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.5 },
                scale: { duration: 0.8, delay: 0.5, type: "spring" },
                y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 } 
              }}
              className="absolute top-[45%] left-[1%] md:left-[4%] w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white shadow-[0_0_30px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <img src="https://i.pravatar.cc/150?img=47" alt="User" className="w-full h-full object-cover" />
            </motion.div>

            {/* Mid Right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.2 },
                scale: { duration: 0.8, delay: 0.2, type: "spring" },
                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 } 
              }}
              className="absolute top-[50%] right-[1%] md:right-[4%] w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-[0_0_40px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <img src="https://i.pravatar.cc/150?img=44" alt="User" className="w-full h-full object-cover" />
            </motion.div>
          </div>

          <div className="max-w-[1200px] mx-auto w-full flex flex-col items-center relative z-10">
            <div className="max-w-[900px]">
              <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-full bg-[#FDF8D5] text-[#3A4D39] text-xs font-bold uppercase tracking-widest">
                The future of decentralized governance
              </div>
              <h1 className="text-deep-black text-5xl md:text-7xl font-black leading-[1.1] mb-8 font-display">
                <span className="relative inline-block whitespace-nowrap">
                  <svg className="absolute left-0 w-full h-[0.5em] bottom-[0.05em]" style={{ color: '#FCEE8E', zIndex: 0 }} viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path d="M 2 16 Q 25 4 50 16 T 98 14" stroke="currentColor" strokeWidth="14" strokeLinecap="round" fill="none" />
                  </svg>
                  <span className="relative z-10 text-deep-black">Simplified</span>
                </span> Governance<br />
                for Your DAO
              </h1>
          <p className="text-slate-600 text-lg md:text-xl font-normal leading-relaxed max-w-[760px] mx-auto mb-10">Make decentralized governance simple and accessible for every member. Vote, propose, and execute DAO decisions without gas fees.</p>
          <div className="flex flex-col items-center gap-12">
            <button 
              onClick={() => handleConnect('hero')}
              disabled={isConnecting || isInitializing}
              className="flex min-w-[240px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-8 bg-primary text-dark-green text-base font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100"
            >
              {activeButton === 'hero' && isConnecting ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  Connecting...
                </>
              ) : 'Connect Wallet to Enter'}
            </button>
            {/* Security Icons Row */}
            <div className="flex items-center gap-12 md:gap-20 grayscale opacity-60">
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="size-8" />
                <span className="text-xs font-bold uppercase tracking-widest">EIP-712</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Shield className="size-8" />
                <span className="text-xs font-bold uppercase tracking-widest">Secure</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Fingerprint className="size-8" />
                <span className="text-xs font-bold uppercase tracking-widest">Private</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Lock className="size-8" />
                <span className="text-xs font-bold uppercase tracking-widest">On-Chain</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-section-bg pt-32 pb-12 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-secondary font-bold tracking-widest text-sm uppercase mb-4 block">Our Infrastructure</span>
              <h2 className="text-5xl font-black text-typography leading-tight font-display">System Capabilities</h2>
            </div>
            <div className="text-typography/60 font-body max-w-xs text-right hidden md:block">
              Propelling the future of decentralization through zero-cost interactions.
            </div>
          </div>
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Fuel}
              title="Gasless Voting"
              description="Cast your vote securely without any ETH in your wallet. We handle the relayer execution on your behalf."
            />
            <FeatureCard
              icon={PenTool}
              title="EIP-712 Signatures"
              description="Utilize standardized typed data signing for maximum security and full compatibility with hardware wallets."
            />
            <FeatureCard
              icon={Zap}
              title="On-Chain Execution"
              description="Seamlessly execute proposals once the threshold is met via our network of automated relayers and validators."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative px-4 md:px-8 z-10 bg-section-bg">
        <div className="max-w-[1200px] mx-auto w-full translate-y-24">
          <div className="bg-dark-green rounded-3xl p-12 md:p-20 text-center shadow-2xl overflow-hidden relative">
            {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(207, 255, 146, 0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          <h2 className="text-white text-3xl md:text-5xl font-black mb-4 font-display">Ready to secure the treasury?</h2>
          <p className="text-slate-300 text-lg mb-10 max-w-[600px] mx-auto">Join thousands of delegators shaping the future of decentralized finance with zero-fee participation.</p>
          <div className="flex justify-center">
            <button 
              onClick={() => handleConnect('cta')}
              disabled={isConnecting || isInitializing}
              className="flex min-w-[200px] items-center justify-center rounded-xl h-14 px-8 bg-primary text-dark-green text-base font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100 cursor-pointer"
            >
              {activeButton === 'cta' && isConnecting ? <Loader2 className="size-5 animate-spin" /> : 'Connect Wallet'}
            </button>
          </div>
        </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
