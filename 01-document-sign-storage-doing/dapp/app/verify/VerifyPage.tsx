"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, redirect } from "next/navigation";

import {
  FileText,
  UploadCloud,
  ShieldCheck,
  CheckCircle,
  X,
  RotateCcw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useWeb3 } from "../../hooks/useWeb3";
import { useDocumentRegistry } from "../../hooks/useDocumentRegistry";
import { ethers } from "ethers";

type VerifyState =
  | "idle"
  | "hashing"
  | "ready"
  | "verifying"
  | "success"
  | "error";

interface VerificationResult {
  signer: string;
  timestamp: string;
  signature: string;
  hash: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const { isConnected, provider, chainId: contextChainId } = useWeb3();
  const contract = useDocumentRegistry();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [signerAddressInput, setSignerAddressInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!isConnected) {
      redirect("/");
    }

  }, [isConnected, router]);

  const computeKeccak256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    return ethers.keccak256(uint8Array);
  };

  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setVerifyState("hashing");
    setVerificationDetails(null);

    try {
      const fileHash = await computeKeccak256(selectedFile);
      setHash(fileHash);
      setVerifyState("ready");
    } catch {
      setHash(null);
      setVerifyState("idle");
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
    setVerificationDetails(null);
    setVerifyState("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    handleRemoveFile();
    setSignerAddressInput("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const canVerify = verifyState === "ready" && isValidAddress(signerAddressInput);

  const handleVerify = async () => {
    if (!canVerify || !hash || !contract) return;

    setVerifyState("verifying");
    setVerificationDetails(null);

    try {
      const hashBytes32 = hash.startsWith("0x") ? hash.toLowerCase() : "0x" + hash.toLowerCase();

      // Check if document exists first
      let exists = false;
      try {
        exists = await contract.isDocumentStored(hashBytes32, { blockTag: 'latest' });
      } catch (checkErr: any) {
        if (checkErr?.code === 'BAD_DATA' && checkErr?.value === '0x') {
          console.error("❌ [Blockchain] Smart contract not found at address:", contract.target);
          setVerifyState("error");
          return;
        }
        throw checkErr;
      }

      if (!exists) {
        setVerifyState("error");
        return;
      }

      const docInfo = await contract.getDocumentInfo(hashBytes32, { blockTag: 'latest' });
      
      const registeredSigner = docInfo.signer;
      const timestampDate = new Date(Number(docInfo.timestamp) * 1000);
      const formattedTimestamp = timestampDate.toISOString().replace("T", " ").substring(0, 19);
      
      if (registeredSigner.toLowerCase() === signerAddressInput.toLowerCase()) {
        setVerificationDetails({
          signer: registeredSigner,
          timestamp: formattedTimestamp,
          signature: docInfo.signature,
          hash: hash
        });
        setVerifyState("success");
      } else {
         setVerifyState("error");
      }

    } catch (err) {
      setVerifyState("error");
    }
  };

  if (!isConnected) return null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Verify Document
        </h1>
        <p className="text-slate-800 dark:text-slate-400">
          Verify a document&apos;s authenticity by providing the file and signer address.
        </p>
      </div>

      {/* 1. File Selection */}
      <div className="bg-white dark:bg-[#0f1423] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-[#1e2333] flex items-center justify-between">
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
          {file && verifyState !== "hashing" && verifyState !== "idle" && (
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {verifyState === "success" ? "FILE VERIFIED" : "FILE READY"}
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          {verifyState === "idle" || verifyState === "hashing" ? (
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
                 : "border-slate-300 dark:border-[#1e2333] bg-slate-50 dark:bg-[#0f1423] hover:bg-slate-100 dark:hover:bg-[#141b2d]"
             }`}>
             <input
               type="file"
               ref={fileInputRef}
               onChange={handleFileSelect}
               className="hidden"
             />
             
             {verifyState === "hashing" ? (
                <div className="flex flex-col items-center justify-center animate-in fade-in py-5">
                   <Loader2 size={32} className="text-primary animate-spin mb-4" />
                   <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                     Processing file...
                   </p>
                </div>
             ) : (
                <>
                  <div className={`size-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 shadow-sm ${
                    isDragOver
                      ? "bg-primary/10 scale-110"
                      : "bg-slate-200 dark:bg-[#1e2333] group-hover:scale-110"
                  }`}>
                    <UploadCloud
                      size={32}
                      className={`transition-colors ${
                        isDragOver
                          ? "text-primary"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-primary"
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
                </>
             )}
             
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-300 dark:border-[#1e2333] bg-slate-100 dark:bg-[#141b2d] animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {file?.name}
                  </h4>
                  <p className="text-xs text-slate-800 dark:text-slate-400 font-mono mt-0.5">
                    {file && formatFileSize(file.size)} •{" "}
                    {file?.type || "Unknown Type"}
                  </p>
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

      {/* 2. Verification Proof */}
      <div
        className={`bg-white dark:bg-[#0f1423] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-500 ${
          verifyState === "idle" || verifyState === "hashing" ? "opacity-60" : "opacity-100"
        }`}>
        <div className="p-6 border-b border-slate-200 dark:border-[#1e2333] flex items-center gap-4">
            <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                2. Verification Proof
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Cryptographic proof of ownership
              </p>
            </div>
        </div>

        <div className="p-8">
            <div className="space-y-6">
               
               {/* Address Input */}
               <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={signerAddressInput}
                      aria-label="Signer Wallet Address"
                      onChange={(e) => {
                        setSignerAddressInput(e.target.value);
                        if(verifyState === "error" || verifyState === "success") {
                            setVerifyState("ready");
                            setVerificationDetails(null);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#141b2d] border border-slate-300 dark:border-[#1e2333] rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                     <AlertCircle size={12} />
                     <span>Ensure the address matches the original issuer&apos;s public key.</span>
                  </div>
               </div>

               {/* Results: Success */}
               {(verifyState === "success" || verifyState === "error") && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">
                     {verificationDetails && verifyState === "success" && (
                        <>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 space-y-1">
                                 <p className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">
                                   Signing Address
                                 </p>
                                 <p className="font-mono text-sm break-all text-indigo-600 dark:text-indigo-400">
                                   {verificationDetails.signer}
                                 </p>
                              </div>
                              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 space-y-1">
                                 <p className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">
                                   Timestamp (UTC)
                                 </p>
                                 <p className="font-mono text-sm text-slate-900 dark:text-white">
                                   {verificationDetails.timestamp}
                                 </p>
                              </div>
                           </div>

                           <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 space-y-1">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Cryptographic Signature (VRS)
                              </p>
                              <p className="font-mono text-xs text-slate-800 dark:text-slate-400 break-all">
                                {verificationDetails.signature}
                              </p>
                           </div>
                        </>
                     )}

                     {verifyState === "success" ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
                           <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                             <CheckCircle size={20} />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                 Verification Successful
                              </h4>
                              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                                 The document hash matches the signature from the specified address.
                              </p>
                           </div>
                        </div>
                     ) : (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-4">
                           <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                             <AlertCircle size={20} />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                 Verification Failed
                              </h4>
                              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                                 The provided document hash does not match the signature from the specified address.
                              </p>
                           </div>
                        </div>
                     )}
                  </div>
               )}
            </div>
        </div>
      </div>

      {/* Verify Action Grid */}
      <div className="space-y-6">
        <button
            onClick={handleVerify}
            disabled={!canVerify}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
               canVerify
                 ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transform hover:-translate-y-0.5 cursor-pointer"
                 : verifyState === "verifying"
                   ? "bg-primary/80 text-white cursor-wait"
                   : "bg-slate-200 dark:bg-[#1e2333] text-slate-500 dark:text-slate-600 cursor-not-allowed"
            }`}>
            {verifyState === "verifying" ? (
               <>
                  <Loader2 size={24} className="animate-spin" />
                  Verifying...
               </>
            ) : (
               <>
                  <ShieldCheck size={24} />
                  Verify Document
               </>
            )}
        </button>

        {verifyState !== "idle" && verifyState !== "hashing" && (
            <div className="flex justify-center animate-in fade-in duration-300">
               <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer uppercase tracking-wider">
                  <RotateCcw size={14} />
                  Reset Process
               </button>
            </div>
        )}
      </div>

    </div>
  );
}
