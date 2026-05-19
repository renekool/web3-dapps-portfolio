"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileSignature,
  ShieldAlert,
  Wallet,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import { useWeb3 } from "../hooks/useWeb3";

export default function SelectWalletPage() {
  const router = useRouter();
  const { address, isSepolia, walletStatus, chainId } = useWeb3();

  // Automatic "App Entry" if requirements are met
  useEffect(() => {
    if (address && isSepolia) {
      router.push("/upload");
    }
  }, [address, isSepolia, router]);

  return (
    <div className="min-h-[calc(100vh-180px)] w-full flex flex-col items-center justify-center py-6 px-6 overflow-hidden">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        
        {/* -- Branding & Identity Section -- */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
           <div className="relative group">
              <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              <div className="relative size-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center justify-center text-indigo-500 transition-all duration-500 group-hover:-translate-y-1">
                <FileSignature size={28} strokeWidth={1.5} />
              </div>
           </div>
        </div>

        {/* -- Hero Core Text Content -- */}
        <div className="text-center space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150 fill-mode-both">
          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl lg:text-[5.25rem] font-bold tracking-[-0.04em] leading-[1] text-slate-900 dark:text-white">
               Welcome to <br />
               <span className="inline-block bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600 bg-clip-text text-transparent pb-1">
                 Truxign
               </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium leading-[1.5] max-w-xl mx-auto">
              The premium identity layer for documents on Ethereum. <br className="hidden md:block" /> Securely sign and verify files with cryptographic proof.
            </p>
          </div>
        </div>

        {/* -- Dynamic Status / Action Section -- */}
        <div className="mt-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
           
           {chainId !== null && !isSepolia ? (
             <div className="p-1 rounded-3xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 shadow-sm animate-in zoom-in-95 duration-500">
                <div className="px-5 py-3.5 flex items-center gap-4">
                   <div className="size-9 rounded-full bg-white dark:bg-slate-900/50 shadow-sm border border-rose-200 dark:border-rose-500/10 flex items-center justify-center text-rose-500">
                      <ShieldAlert size={16} strokeWidth={2} />
                   </div>
                   <div className="flex-1 text-left">
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none mb-1">Network Exception</p>
                      <p className="text-[12px] font-medium text-slate-600 dark:text-slate-500">Wrong network. Please switch to <span className="text-rose-600 dark:text-rose-400 font-bold">Sepolia Testnet</span></p>
                   </div>
                   <div className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                </div>
             </div>
           ) : !address ? (
             <div className="p-1 rounded-3xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 shadow-sm backdrop-blur-sm">
                <div className="px-5 py-3.5 flex items-center gap-4">
                   <div className="size-9 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300">
                      <Wallet size={16} strokeWidth={2} />
                   </div>
                   <div className="flex-1 text-left">
                      <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none mb-1">Infrastructure Ready</p>
                      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-500">Awaiting wallet connection from header...</p>
                   </div>
                   <div className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                </div>
             </div>
           ) : (
             <div className="p-1 rounded-3xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 shadow-sm animate-in zoom-in-95 duration-500">
                <div className="px-5 py-3.5 flex items-center gap-4">
                   <div className="size-9 rounded-full bg-white dark:bg-slate-900/50 shadow-sm border border-emerald-200 dark:border-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <div className="relative">
                         <CheckCircle size={16} strokeWidth={2.5} />
                         <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20" />
                      </div>
                   </div>
                   <div className="flex-1 text-left">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">Identity Verified</p>
                      <p className="text-[12px] font-medium text-slate-600 dark:text-slate-500">Authorized. Accessing your signature vault...</p>
                   </div>
                </div>
             </div>
           )}

        </div>

        {/* -- Trust & Social Validation Footer -- */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/50 w-full max-w-xs flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
           <div className="flex -space-x-3 items-center">
              {[44, 32, 68].map((id) => (
                <div key={id} className="relative">
                   <Image
                     src={`https://randomuser.me/api/portraits/${id % 2 === 0 ? 'men' : 'women'}/${id}.jpg`}
                     alt="User validation"
                     width={40}
                     height={40}
                     className="size-9 rounded-full border-2 border-white dark:border-slate-900 shadow-sm object-cover"
                   />
                </div>
              ))}
              <div className="size-9 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-400 shadow-sm z-10">
                1k+
              </div>
           </div>
           
          </div>
       </div>
    </div>
  );
}
