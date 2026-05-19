"use client";

import React from "react";
import { User, Check, Copy, FileText, Calendar } from "lucide-react";

interface Document {
  hash: string;
  name: string;
  category: string;
  signer: string;
  timestamp: number;
  signature: string;
  status: "Stored" | "Verified";
}

interface DocumentTableProps {
  documents: Document[];
  copiedHash: string | null;
  onCopy: (text: string) => void;
  truncateHash: (hash: string) => string;
  formatDate: (timestamp: number) => { date: string; time: string };
}

export const DocumentTable = ({ 
  documents, 
  copiedHash, 
  onCopy, 
  truncateHash, 
  formatDate 
}: DocumentTableProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Document Name</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Signer Address</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Hash Fingerprint</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Registration Date</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Network Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {documents.map((doc, idx) => (
            <tr 
              key={doc.hash} 
              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200 group animate-in fade-in slide-in-from-left-2"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {doc.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {doc.category}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <div className="size-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                      <User size={12} />
                    </div>
                    <span className="font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {truncateHash(doc.signer)}
                    </span>
                    <button 
                      onClick={() => onCopy(doc.signer)}
                      className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer ${copiedHash === doc.signer ? 'text-emerald-500' : 'text-slate-400'}`}
                      aria-label="Copy signer address"
                    >
                      {copiedHash === doc.signer ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <span className="font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {truncateHash(doc.hash)}
                    </span>
                    <button 
                      onClick={() => onCopy(doc.hash)}
                      className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer ${copiedHash === doc.hash ? 'text-emerald-500' : 'text-slate-400'}`}
                      aria-label="Copy document hash"
                    >
                      {copiedHash === doc.hash ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col items-center justify-center text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{formatDate(doc.timestamp).date}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                    {formatDate(doc.timestamp).time}
                  </span>
                </div>
              </td>
              <td className="px-6 py-5 text-center">
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Stored
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
