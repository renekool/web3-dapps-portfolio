"use client";

import React, { useMemo, useCallback, useReducer, useEffect } from "react";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Shield, 
  Loader2, 
  AlertCircle,
  FileText
} from "lucide-react";
import { useWeb3 } from "../../../hooks/useWeb3";
import { useDocumentRegistry } from "../../../hooks/useDocumentRegistry";
import { DocumentTable } from "./DocumentTable";
import { Pagination } from "./Pagination";

interface Document {
  hash: string;
  name: string;
  category: string;
  signer: string;
  timestamp: number;
  signature: string;
  status: "Stored" | "Verified";
}

type State = {
  documents: Document[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  searchTerm: string;
  filterWallet: string;
  isFilterOpen: boolean;
  currentPage: number;
  copiedHash: string | null;
};

type Action = 
  | { type: 'FETCH_START', isRefresh: boolean }
  | { type: 'FETCH_SUCCESS', documents: Document[] }
  | { type: 'FETCH_ERROR', error: string }
  | { type: 'SET_SEARCH', term: string }
  | { type: 'SET_FILTER_WALLET', wallet: string }
  | { type: 'TOGGLE_FILTER', value?: boolean }
  | { type: 'SET_PAGE', page: number }
  | { type: 'SET_COPIED', hash: string | null };

const initialState: State = {
  documents: [],
  loading: true,
  refreshing: false,
  error: null,
  searchTerm: "",
  filterWallet: "all",
  isFilterOpen: false,
  currentPage: 1,
  copiedHash: null
};

function historyReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { 
        ...state, 
        loading: !action.isRefresh, 
        refreshing: action.isRefresh,
        error: null 
      };
    case 'FETCH_SUCCESS':
      return { 
        ...state, 
        documents: action.documents, 
        loading: false, 
        refreshing: false 
      };
    case 'FETCH_ERROR':
      return { 
        ...state, 
        error: action.error, 
        loading: false, 
        refreshing: false 
      };
    case 'SET_SEARCH':
      return { ...state, searchTerm: action.term, currentPage: 1 };
    case 'SET_FILTER_WALLET':
      return { ...state, filterWallet: action.wallet, currentPage: 1, isFilterOpen: false };
    case 'TOGGLE_FILTER':
      return { ...state, isFilterOpen: action.value !== undefined ? action.value : !state.isFilterOpen };
    case 'SET_PAGE':
      return { ...state, currentPage: action.page };
    case 'SET_COPIED':
      return { ...state, copiedHash: action.hash };
    default:
      return state;
  }
}

const itemsPerPage = 5;

export const DocumentHistory = () => {
  const { isConnected } = useWeb3();
  const contract = useDocumentRegistry();
  const [state, dispatch] = useReducer(historyReducer, initialState);
  const { 
    documents, 
    loading, 
    refreshing, 
    error,
    searchTerm,
    filterWallet,
    isFilterOpen,
    currentPage,
    copiedHash
  } = state;

  const fetchDocuments = useCallback(async (isRefresh = false) => {
    if (!contract) return;
    
    dispatch({ type: 'FETCH_START', isRefresh });

    try {
      const count = await contract.getDocumentCount();
      const docs: Document[] = [];
      
      for (let i = Number(count) - 1; i >= 0; i--) {
        const hash = await contract.getDocumentHashByIndex(i);
        const info = await contract.getDocumentInfo(hash);
        
        docs.push({
          hash: info.hash,
          name: info.fileName,
          category: info.fileCategory,
          signer: info.signer,
          timestamp: Number(info.timestamp),
          signature: info.signature,
          status: "Stored"
        });
      }
      
      dispatch({ type: 'FETCH_SUCCESS', documents: docs });
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      dispatch({ type: 'FETCH_ERROR', error: "Failed to load document history. Ensure the contract is deployed." });
    }
  }, [contract]);

  useEffect(() => {
    if (isConnected && contract) {
      fetchDocuments();
    }
  }, [isConnected, contract, fetchDocuments]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    dispatch({ type: 'SET_COPIED', hash: text });
    setTimeout(() => dispatch({ type: 'SET_COPIED', hash: null }), 2000);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const truncateHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  const uniqueSigners = useMemo(() => {
    const signers = new Set(documents.map(d => d.signer));
    return Array.from(signers);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           doc.hash.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWallet = filterWallet === "all" || doc.signer.toLowerCase() === filterWallet.toLowerCase();
      return matchesSearch && matchesWallet;
    });
  }, [documents, searchTerm, filterWallet]);

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDocuments.slice(start, start + itemsPerPage);
  }, [filteredDocuments, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredDocuments.length);

  // ─── Loading State ────────────────────────────────────────────────
  if (loading && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <Loader2 size={48} className="text-primary animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loading History</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching records from blockchain...</p>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error && documents.length === 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-500">
        <div className="size-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Connection Error</h3>
          <p className="text-slate-700 dark:text-slate-400 max-w-md mx-auto">{error}</p>
        </div>
        <button 
          onClick={() => fetchDocuments()}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  // ─── Main View ────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* 
        INNER CANVAS CONTAINER
        - min-w-[1000px] ensures it doesn't squash, triggering the PARENT main scroll.
        - The width isn't fixed at 1400px anymore, so on large screens it respects max-w-5xl.
      */}
      <div className="flex flex-col items-stretch min-w-full w-max space-y-8 pb-10 pr-10">

        {/* ── Header: Title + Controls ─────────────────────────── */}
        <div className="w-full flex flex-row items-center justify-between gap-8 py-2">
          <div className="space-y-1 shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              Document History
              <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {filteredDocuments.length}
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              View all documents secured on the Ethereum blockchain.
            </p>
          </div>

          <div className="flex flex-row items-center gap-3 shrink-0">
            <button 
              onClick={() => fetchDocuments(true)}
              disabled={refreshing}
              className={`p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${refreshing ? "opacity-50 cursor-wait" : ""}`}
              title="Refresh records"
            >
              <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>

            <div className="relative group min-w-[320px]">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search by name or hash..."
                value={searchTerm}
                onChange={(e) => dispatch({ type: 'SET_SEARCH', term: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm group-hover:border-slate-400 dark:group-hover:border-slate-700"
              />
            </div>

            <div className="relative">
              <button 
                onClick={() => dispatch({ type: 'TOGGLE_FILTER' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 shadow-sm font-medium text-sm cursor-pointer ${
                  filterWallet !== "all" 
                    ? "bg-primary/10 border-primary text-primary" 
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary"
                }`}
              >
                <Filter size={18} />
                {filterWallet === "all" ? "All Wallets" : truncateHash(filterWallet)}
              </button>

              {isFilterOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => dispatch({ type: 'TOGGLE_FILTER', value: false })}
                    role="presentation"
                  />
                  <div className="absolute right-0 mt-2 w-64 z-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filter by Signer</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <button 
                        onClick={() => dispatch({ type: 'SET_FILTER_WALLET', wallet: "all" })}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors ${filterWallet === "all" ? "bg-primary/5 text-primary font-bold" : "text-slate-700 dark:text-slate-300"}`}
                      >
                        All Wallets
                        {filterWallet === "all" && <Shield size={14} className="text-primary fill-primary/20" />}
                      </button>
                      {uniqueSigners.map((signer) => (
                        <button 
                          key={signer}
                          onClick={() => dispatch({ type: 'SET_FILTER_WALLET', wallet: signer })}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors ${filterWallet === signer ? "bg-primary/5 text-primary font-bold" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          <span className="font-mono">{truncateHash(signer)}</span>
                          {filterWallet === signer && <Shield size={14} className="text-primary fill-primary/20" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Content: Table / Empty States ────────────────── */}
        {documents.length === 0 ? (
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center text-center space-y-6 shadow-sm">
            <div className="size-24 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
              <FileText size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No documents registered</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-sm">
                The blockchain history is currently empty. Start by uploading and signing your first document.
              </p>
            </div>
            <button 
              onClick={() => fetchDocuments(true)}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center text-center space-y-6 shadow-sm">
            <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Search size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">No documents found</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-sm">
                We couldn&apos;t find any documents matching your search criteria: <span className="font-bold text-primary">&quot;{searchTerm}&quot;</span>
              </p>
            </div>
            <button 
              onClick={() => dispatch({ type: 'SET_SEARCH', term: "" })}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="w-full space-y-0 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <DocumentTable 
              documents={paginatedDocuments}
              copiedHash={copiedHash}
              onCopy={copyToClipboard}
              truncateHash={truncateHash}
              formatDate={formatDate}
            />
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredDocuments.length}
              onPageChange={(page) => dispatch({ type: 'SET_PAGE', page })}
            />
          </div>
        )}

      </div>
    </div>
  );
};
