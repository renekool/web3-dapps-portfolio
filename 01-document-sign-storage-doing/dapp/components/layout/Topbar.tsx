'use client'

import React, { useRef, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { Lock, Wallet, ChevronDown, Check, Copy, LogOut, Eye, EyeOff } from "lucide-react";
import { useWeb3 } from "../../hooks/useWeb3";

type TopbarState = {
  isDropdownOpen: boolean;
  balanceVisible: boolean;
  copied: boolean;
};

type TopbarAction = 
  | { type: 'TOGGLE_DROPDOWN', value?: boolean }
  | { type: 'TOGGLE_BALANCE' }
  | { type: 'SET_COPIED', value: boolean };

function topbarReducer(state: TopbarState, action: TopbarAction): TopbarState {
  switch (action.type) {
    case 'TOGGLE_DROPDOWN':
      return { ...state, isDropdownOpen: action.value !== undefined ? action.value : !state.isDropdownOpen };
    case 'TOGGLE_BALANCE':
      return { ...state, balanceVisible: !state.balanceVisible };
    case 'SET_COPIED':
      return { ...state, copied: action.value };
    default:
      return state;
  }
}

export function Topbar({ isScrolled }: { isScrolled: boolean }) {
  const [state, dispatch] = useReducer(topbarReducer, {
    isDropdownOpen: false,
    balanceVisible: true,
    copied: false
  });
  const { isDropdownOpen, balanceVisible, copied } = state;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address, walletStatus, connect, disconnect, balanceEth, chainId, isSepolia } = useWeb3();
  const router = useRouter();

  const handleConnect = async () => {
    if (walletStatus === 'connecting') return;
    try {
      await connect();
    } catch (err) {
      console.error("Connection Error:", err);
    }
  };

  const getNetworkName = (id: number | null) => {
    switch (id) {
      case 11155111: return "Sepolia Network";
      case 1:        return "Ethereum Mainnet";
      case 31337:    return "Anvil Network";
      default:       return id ? "Unknown Network" : "No Network";
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        dispatch({ type: 'TOGGLE_DROPDOWN', value: false });
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address) {
      navigator.clipboard.writeText(address);
      dispatch({ type: 'SET_COPIED', value: true });
      setTimeout(() => dispatch({ type: 'SET_COPIED', value: false }), 2000);
    }
  };

  return (
    <header
      style={{ height: '60px', minHeight: '60px' }}
      className={`border-b shrink-0 flex items-center justify-between px-10 sticky top-0 z-30 transition-all duration-300 ${
        isScrolled
          ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-slate-200/50 dark:border-slate-800/50 shadow-sm"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none"
      }`}
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
        <Lock size={18} />
        <span className="text-xs font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200">
          Secure Environment
        </span>
      </div>

      <div className="flex items-center gap-4">
        {!address ? (
          <button
            onClick={handleConnect}
            disabled={walletStatus === 'connecting'}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/10 disabled:opacity-50"
          >
            <Wallet size={14} />
            {walletStatus === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="relative" ref={dropdownRef} key={address}>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_DROPDOWN' })}
              className={`flex items-center gap-3 pl-3 pr-4 py-2 rounded-full border transition-all duration-200 ${
                isDropdownOpen
                  ? "bg-white dark:bg-slate-800 border-indigo-400/30 ring-2 ring-indigo-500/10 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-center relative w-3 h-3">
                <div className={`h-2.5 w-2.5 rounded-full ${isSepolia ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`}></div>
                <div className={`absolute inset-0 rounded-full ${isSepolia ? 'bg-emerald-500' : 'bg-rose-500'} animate-ping opacity-75`}></div>
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                      Active Wallet
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isSepolia ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                      {getNetworkName(chainId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                      <Wallet size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                        Wallet Identity
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-400 font-mono">
                          {balanceVisible ? (balanceEth ? `${parseFloat(balanceEth).toFixed(4)} ETH` : "...") : "•••• ETH"}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: 'TOGGLE_BALANCE' });
                          }}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                        >
                          {balanceVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={handleCopyAddress}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-400">
                          Copy Address
                        </span>
                        <span className="text-xs font-mono text-slate-900 dark:text-white truncate max-w-[140px]">
                          {address}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>

                  <button
                    onClick={() => {
                      dispatch({ type: 'TOGGLE_DROPDOWN', value: false });
                      disconnect();
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 group-hover:text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                      <LogOut size={16} />
                    </div>
                    <span className="text-sm font-semibold">Disconnect</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
