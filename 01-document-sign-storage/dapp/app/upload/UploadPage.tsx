"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  X,
  CheckCircle,
  Loader2,
  PenTool,
  RotateCcw,
  Lock,
  Copy,
  Check,
  Database,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useRouter, redirect } from "next/navigation";

import { useWeb3 } from "../../hooks/useWeb3";
import { useDocumentRegistry } from "../../hooks/useDocumentRegistry";
import { ethers } from "ethers";

import { createPortal } from "react-dom";

type UploadState =
  | "idle"
  | "hashing"
  | "hash-generated"
  | "awaiting-confirmation"
  | "signing"
  | "sign-error"
  | "signed"
  | "ready-to-store"
  | "awaiting-store-confirmation"
  | "storing"
  | "stored"
  | "tx-confirmed"
  | "store-error"
  | "document-exists-error";

export default function UploadPage() {
  const router = useRouter();
  const { isConnected, address: walletAddress, signer, provider, chainId: currentChainId } = useWeb3();
  const contract = useDocumentRegistry();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedSignature, setCopiedSignature] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [category, setCategory] = useState<string>("Legal");

  const TARGET_CHAIN_ID = 11155111; // Sepolia

  React.useEffect(() => {
    setMounted(true);
    if (!isConnected) {
      redirect("/");
    }
  }, [isConnected, router]);

  const isSupportedNetwork = currentChainId === TARGET_CHAIN_ID;

  const copyToClipboard = async (
    text: string,
    type: "hash" | "address" | "signature" | "txHash"
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "hash") {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      } else if (type === "address") {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else if (type === "signature") {
        setCopiedSignature(true);
        setTimeout(() => setCopiedSignature(false), 2000);
      } else if (type === "txHash") {
        setCopiedTxHash(true);
        setTimeout(() => setCopiedTxHash(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const computeKeccak256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    return ethers.keccak256(uint8Array);
  };

  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setUploadState("hashing");

    try {
      const fileHash = await computeKeccak256(selectedFile);
      setHash(fileHash);
      setUploadState("hash-generated");
    } catch {
      setHash(null);
      setUploadState("idle");
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setHash(null);
    setSignature(null);
    setTimestamp(null);
    setTxHash(null);
    setStoreError(null);
    setUploadState("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSignClick = () => {
    if (uploadState === "hash-generated" || uploadState === "sign-error") {
      setUploadState("awaiting-confirmation");
    }
  };

  const handleConfirmSign = async () => {
    if (!signer || !hash) {
      console.error("⚠️ [Signature] Missing signer or hash");
      return;
    }

    setUploadState("signing");
    console.log("✍️ [Signature] Requesting signature for hash:", hash);

    try {
      // Message format matching requirements
      const messageToSign = `Signing document with hash: ${hash}`;
      
      // Use the real signer to generate a cryptographic signature (65 bytes)
      const realSignature = await signer.signMessage(messageToSign);
      console.log("✅ [Signature] Success:", realSignature);
      
      setSignature(realSignature);
      setTimestamp(new Date().toISOString().replace("T", " ").substring(0, 19));
      setUploadState("signed");
    } catch (err: any) {
      console.error("❌ [Signature] Failed:", err);
      // Check if user rejected the signature request
      if (err?.code === "ACTION_REJECTED" || err?.code === 4001) {
        setUploadState("hash-generated"); // Go back to hash state
        return;
      }
      setUploadState("sign-error");
    }
  };

  const handleCancelSign = () => {
    setUploadState("hash-generated");
  };

  const handleSuccessAccept = () => {
    setUploadState("ready-to-store");
  };

  const handleStoreClick = () => {
    if (uploadState === "ready-to-store" || uploadState === "store-error") {
      setUploadState("awaiting-store-confirmation");
    }
  };

  const handleCancelStore = () => {
    setUploadState("ready-to-store");
  };

  const handleConfirmStore = async () => {
    if (!contract || !signer || !hash || !signature) {
      console.error("⚠️ [Blockchain] Missing required parameters:", { contract: !!contract, signer: !!signer, hash, signature });
      return;
    }

    setUploadState("storing");
    setStoreError(null);

    try {
      const signerAddress = await signer.getAddress();
      console.log("🚀 [Blockchain] Initiation Registration Process...");
      console.log("📍 Contract:", contract.target);
      console.log("👤 Signer:", signerAddress);
      
      const hashBytes32 = hash.startsWith("0x") ? hash.toLowerCase() : "0x" + hash.toLowerCase();
      
      // Verification step to avoid redundant transactions
      let alreadyStored = false;
      try {
        alreadyStored = await contract.isDocumentStored(hashBytes32, { blockTag: 'latest' });
      } catch (checkErr: any) {
        console.warn("⚠️ [Blockchain] isDocumentStored Check failed, proceeding anyway:", checkErr.message);
      }
      
      if (alreadyStored) {
        console.warn("ℹ️ [Blockchain] Document already registered.");
        setUploadState("document-exists-error");
        setStoreError("This document has already been registered in the blockchain.");
        return;
      }

      const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
      
      console.log("📡 [Blockchain] Broadcasting transaction...");
      
      const tx = await contract.storeDocumentHash(
        hashBytes32,
        currentTimestamp,
        signature,
        signerAddress,
        file?.name || "Unknown",
        category,
        { gasLimit: 300000 }
      );
      
      console.log("✅ [Blockchain] Transaction broadcast successfully:", tx.hash);
      const receipt = await tx.wait();
      
      console.log("✨ [Blockchain] Transaction confirmed in block:", receipt.blockNumber);
      setTxHash(receipt.hash);
      setUploadState("stored");
    } catch (err: any) {
      console.error("❌ [Blockchain] Registry Failed:", err);
      
      let errorMessage = "Our secure registry is temporarily unavailable.";
      
      if (err?.code === "ACTION_REJECTED" || err?.code === 4001) {
        errorMessage = "Transaction was declined in your wallet.";
        setUploadState("ready-to-store");
        return;
      } else if (err?.message?.toLowerCase().includes("insufficient funds")) {
        errorMessage = "Insufficient Sepolia ETH to cover the network gas fees.";
      } else if (err?.message?.toLowerCase().includes("already registered")) {
        setUploadState("document-exists-error");
        setStoreError("This document has already been registered.");
        return;
      }
      
      setStoreError(errorMessage);
      setUploadState("store-error");
    }
  };

  const handleStoredAccept = () => {
    setUploadState("tx-confirmed");
  };

  const handleReset = () => {
    handleRemoveFile();
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      {/* Network Warning Banner */}
      {!isSupportedNetwork && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Unsupported Network Detected
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-400">
              Please connect your wallet to the <strong>Sepolia Test Network (Chain ID: 11155111)</strong> to use the registry.
            </p>
          </div>
        </div>
      )}
      
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Upload & Sign Document
        </h1>
        <p className="text-slate-800 dark:text-slate-400">
          Securely timestamp and cryptographically sign your files on the
          Ethereum blockchain.
        </p>
      </div>

      {/* 1. File Selection Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                1. File Selection
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Upload your source document
              </p>
            </div>
          </div>
          {file && (
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                File Ready
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          {uploadState === "idle" ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              className={`p-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all cursor-pointer group ${
                isDragOver
                  ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]"
                  : "border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 shadow-sm ${
                isDragOver
                  ? "bg-primary/10 scale-110"
                  : "bg-slate-200 dark:bg-slate-800 group-hover:scale-110"
              }`}>
                <UploadCloud
                  size={32}
                  className={`transition-colors ${
                    isDragOver
                      ? "text-primary"
                      : "text-slate-500 dark:text-slate-500 group-hover:text-primary"
                  }`}
                />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Upload a Document
              </h4>
              <p className="text-slate-800 dark:text-slate-400 text-sm mb-6">
                Drag and drop a file here, or click to select
              </p>
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer">
                <UploadCloud size={16} />
                Choose File
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {file?.name}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-slate-800 dark:text-slate-400 font-mono">
                      {file && formatFileSize(file.size)} •{" "}
                      {file?.type || "Unknown Type"}
                    </p>
                    <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category:</span>
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="text-[11px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-200"
                      >
                        <option value="Legal">Legal</option>
                        <option value="Financial">Financial</option>
                        <option value="Identity">Identity</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Digital Signature Card */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-500 ${
          uploadState === "idle" ? "opacity-60" : "opacity-100"
        }`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                2. Digital Signature
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Cryptographic proof of ownership
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {uploadState === "idle" ? (
            <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 border-dashed">
              <div className="size-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3">
                <FileText
                  size={24}
                  className="text-slate-700 dark:text-slate-400"
                />
              </div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                No Document Hash
              </h4>
              <p className="text-xs text-slate-800 dark:text-slate-400 mt-1">
                Please upload a file first to generate its hash
              </p>
            </div>
          ) : uploadState === "hashing" ? (
            <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-300">
              <Loader2 size={32} className="text-primary animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Generating SHA-256 Hash...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Calculating cryptographic fingerprint
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Hash Block */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-emerald-500/10 bg-emerald-500/10 flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    File Hash Generated Successfully
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">
                    # SHA-256 HASH:
                  </p>
                  <div className="font-mono text-xs sm:text-sm text-emerald-900 dark:text-emerald-100 break-all">
                    {hash}
                  </div>
                </div>
              </div>

              {/* Final Signature Details */}
              {uploadState === "ready-to-store" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Signing Address
                    </p>
                    <p className="text-xs font-mono text-primary break-all">
                      {walletAddress || "0x..."}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Timestamp (UTC)
                    </p>
                    <p className="text-xs font-mono text-slate-900 dark:text-white">
                      {timestamp}
                    </p>
                  </div>
                  <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Cryptographic Signature (VRS)
                    </p>
                    <p className="text-xs font-mono text-slate-800 dark:text-slate-400 break-all leading-relaxed">
                      {signature}
                    </p>
                  </div>

                  <div className="col-span-1 md:col-span-2 mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Signature Captured • Ready for Blockchain Broadcast
                    </span>
                  </div>
                </div>
              )}

              {/* Store Error Alert */}
              {(uploadState === "store-error" || uploadState === "document-exists-error") && (
                <div className={`p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                  uploadState === "document-exists-error"
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                    uploadState === "document-exists-error"
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-red-500/20 text-red-500"
                  }`}>
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${
                      uploadState === "document-exists-error"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {uploadState === "document-exists-error"
                        ? "Document Already Exists"
                        : "Storage Failed"}
                    </h4>
                    <p className={`text-xs mt-0.5 ${
                      uploadState === "document-exists-error"
                        ? "text-amber-600/80 dark:text-amber-400/80"
                        : "text-red-600/80 dark:text-red-400/80"
                    }`}>
                      {storeError || "An unexpected error occurred."}
                    </p>
                  </div>
                </div>
              )}

              {/* Sign Error Alert */}
              {uploadState === "sign-error" && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Signature Failed
                    </h4>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                      The document could not be signed. Please try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Confirmed Banner */}
      {uploadState === "tx-confirmed" && txHash && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl shadow-primary/20">
            {/* Decorative Background Elements */}
            <div className="absolute -top-12 -right-12 size-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 size-40 rounded-full bg-black/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row items-center justify-between px-5 sm:px-8 py-5 lg:py-4 gap-6 lg:gap-12">
              {/* Left: Success Message */}
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left shrink-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 shadow-inner backdrop-blur-sm ring-1 ring-white/30">
                  <Check size={20} className="text-white" strokeWidth={3} />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-base lg:text-sm font-bold text-white tracking-tight leading-tight uppercase">
                    Transaction Confirmed
                  </h3>
                  <p className="text-[11px] font-medium text-white/80">
                    Finalized on Ethereum Network
                  </p>
                </div>
              </div>

              {/* Right: Integrated Transaction ID "Ticket" */}
              <div className="flex w-full lg:flex-1 lg:max-w-2xl items-center gap-3 rounded-xl bg-black/20 py-2.5 px-4 backdrop-blur-md border border-white/10 transition-colors hover:bg-black/30 group min-w-0 overflow-hidden">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white shadow-sm">
                  <Database size={14} />
                </div>

                <div className="flex flex-1 flex-col items-start overflow-hidden min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 mb-px">
                    Transaction ID
                  </span>
                  <div className="w-full truncate font-mono text-[11px] text-white font-medium lg:max-w-[440px]">
                    {txHash}
                  </div>
                </div>

                <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block shrink-0" />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => txHash && copyToClipboard(txHash, "txHash")}
                    className="flex size-7 items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
                    title="Copy Hash">
                    {copiedTxHash ? (
                      <Check size={14} className="text-emerald-300" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-7 items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
                    title="View on Explorer">
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {uploadState !== "tx-confirmed" && (
        <button
          onClick={
            uploadState === "ready-to-store" || uploadState === "store-error"
              ? handleStoreClick
              : handleSignClick
          }
          disabled={
            !isSupportedNetwork ||
            (uploadState !== "hash-generated" &&
            uploadState !== "ready-to-store" &&
            uploadState !== "sign-error" &&
            uploadState !== "store-error")
          }
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl flex items-center justify-center gap-3 ${
            uploadState === "hash-generated" || uploadState === "sign-error"
              ? "bg-primary hover:bg-primary/90 text-white shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 cursor-pointer"
              : uploadState === "signing" || uploadState === "storing"
                ? "bg-primary/80 text-white cursor-wait"
                : uploadState === "ready-to-store" || uploadState === "store-error"
                  ? "bg-primary hover:bg-primary/90 text-white shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 cursor-pointer"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed"
          }`}>
          {uploadState === "signing" ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Signing Document...
            </>
          ) : uploadState === "storing" ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Storing on Blockchain...
            </>
          ) : uploadState === "ready-to-store" || uploadState === "store-error" ? (
            <>
              <Database size={24} />
              Store on Blockchain
            </>
          ) : (
            <>
              <PenTool size={24} />
              Sign Document
            </>
          )}
        </button>
      )}

      {/* Reset Process */}
      {uploadState !== "idle" && uploadState !== "hashing" && (
        <div className="flex justify-center animate-in fade-in duration-300">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer uppercase tracking-wider">
            <RotateCcw size={14} />
            Reset Process
          </button>
        </div>
      )}

      {/* Modal 1: Confirm Signature */}
      {mounted && uploadState === "awaiting-confirmation" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl shadow-slate-400/20 dark:shadow-black/50 border border-slate-300 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Lock size={24} className="text-amber-500" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Confirm Signature
                </h3>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-400">
                You are about to sign the following message:
              </p>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Document Hash (SHA-256)
                </p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700">
                  <div className="flex-1 font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                    {hash}
                  </div>
                  <button
                    onClick={() => hash && copyToClipboard(hash, "hash")}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer">
                    {copiedHash ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Signer Address
                </p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700">
                  <div className="flex-1 font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                    {walletAddress || "0x..."}
                  </div>
                  <button
                    onClick={() => copyToClipboard(walletAddress || "", "address")}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer">
                    {copiedAddress ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancelSign}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSign}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal 2: Success (Signature) */}
      {mounted && uploadState === "signed" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl shadow-slate-400/20 dark:shadow-black/50 border border-slate-300 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                <CheckCircle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Success
                </h3>
                <p className="text-slate-800 dark:text-slate-400">
                  Document signed successfully!
                </p>
              </div>

              <div className="w-full space-y-2 text-left">
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">
                  Signature
                </p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700">
                  <div className="flex-1 font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                    {signature}
                  </div>
                  <button
                    onClick={() => signature && copyToClipboard(signature, "signature")}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer">
                    {copiedSignature ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSuccessAccept}
                className="w-full px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal 3: Confirm Blockchain Storage */}
      {mounted && uploadState === "awaiting-store-confirmation" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl shadow-slate-400/20 dark:shadow-black/50 border border-slate-300 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Database size={24} className="text-primary" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Confirm Blockchain Storage
                </h3>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-400">
                You are about to store the hash on Sepolia blockchain.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Document Hash</p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 truncate font-mono text-xs">
                    {hash}
                  </div>
                </div>
                
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    This action will require Sepolia ETH for gas fees.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancelStore}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStore}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal 4: Success Stored */}
      {mounted && uploadState === "stored" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl shadow-slate-400/20 dark:shadow-black/50 border border-slate-300 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                <CheckCircle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Blockchain Verified
                </h3>
                <p className="text-slate-800 dark:text-slate-400">
                  Document secured on Sepolia blockchain!
                </p>
              </div>

              <button
                onClick={handleStoredAccept}
                className="w-full px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
