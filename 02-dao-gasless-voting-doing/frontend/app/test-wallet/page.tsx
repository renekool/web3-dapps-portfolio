'use client';

import React, { useState, useEffect, useRef } from 'react';

type LogEvent = {
  type: string;
  data: any;
  timestamp: string;
};

export default function TestWalletPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const isAvailable = typeof window !== 'undefined' && !!(window as any).ethereum;

  const addLog = (type: string, data: any) => {
    setLogs((prev) => [
      {
        type,
        data: JSON.stringify(data, null, 2),
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
  };

  const connect = async () => {
    if (!isAvailable) return;
    try {
      addLog('Connect initiated', 'Requesting eth_requestAccounts');
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0] || null);
      setStatus(accounts.length > 0 ? 'connected' : 'disconnected');
      addLog('Connected', accounts);
    } catch (e: any) {
      addLog('Connect Error', e.message);
    }
  };

  const checkStatus = async () => {
    if (!isAvailable) return;
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
      
      let isUnlocked = true;
      let unlockMsg = "N/A";
      
      // Intentar detectar si MetaMask está explícitamente bloqueado
      if (typeof (window as any).ethereum._metamask?.isUnlocked === 'function') {
        isUnlocked = await (window as any).ethereum._metamask.isUnlocked();
        unlockMsg = isUnlocked ? "Unlocked=TRUE" : "Unlocked=FALSE (LOCKED!)";
      }

      addLog('Manual eth_accounts check', {
        accounts,
        isUnlocked: unlockMsg
      });
      
      if (!isUnlocked || accounts.length === 0) {
        setAccount(null);
        setStatus('disconnected');
      } else {
        setAccount(accounts[0] || null);
        setStatus('connected');
      }
    } catch (e: any) {
      addLog('Check Error', e.message);
    }
  };

  useEffect(() => {
    if (!isAvailable) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: any) => {
      addLog('Event: accountsChanged', accounts);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setStatus('connected');
      } else {
        setAccount(null);
        setStatus('disconnected');
      }
    };

    const handleChainChanged = (chainId: any) => {
      addLog('Event: chainChanged', chainId);
    };

    const handleConnect = (info: any) => {
      addLog('Event: connect', info);
      setStatus('connected');
    };

    const handleDisconnect = (error: any) => {
      addLog('Event: disconnect', error);
      setAccount(null);
      setStatus('disconnected');
    };

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);
    eth.on('connect', handleConnect);
    eth.on('disconnect', handleDisconnect);

    // Initial check
    checkStatus();

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
      eth.removeListener('connect', handleConnect);
      eth.removeListener('disconnect', handleDisconnect);
    };
  }, [isAvailable]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-emerald-400">MetaMask Event Sandbox</h1>
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl mb-4 font-semibold text-white">Wallet State</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded-lg">
              <span className="text-slate-400 text-sm">Status:</span>
              <div className={`text-lg font-bold ${status === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                {status.toUpperCase()}
              </div>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg">
              <span className="text-slate-400 text-sm">Account:</span>
              <div className="text-sm truncate mt-1">
                {account || 'None'}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button 
              onClick={connect}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold transition-colors"
            >
              Connect / Re-Request
            </button>
            <button 
              onClick={checkStatus}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
            >
              Force eth_accounts Ping
            </button>
            <button 
              onClick={async () => {
                if (!isAvailable) return;
                try {
                  addLog('Revoke initiated', 'Requesting wallet_revokePermissions');
                  await (window as any).ethereum.request({
                    method: 'wallet_revokePermissions',
                    params: [{ eth_accounts: {} }]
                  });
                  addLog('Revoke Success', 'Permissions revoked');
                  checkStatus();
                } catch (e: any) {
                  addLog('Revoke Error', e.message);
                }
              }}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors"
            >
              REVOKE Permission (Brute Force)
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl mb-4 font-semibold text-white">Event Log (Real-time)</h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {logs.length === 0 && <p className="text-slate-500">Waiting for events...</p>}
            {logs.map((log, i) => (
              <div key={i} className="p-4 bg-slate-900 rounded-lg border-l-4 border-emerald-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-emerald-400">{log.type}</span>
                  <span className="text-xs text-slate-500">{log.timestamp}</span>
                </div>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-950 p-2 rounded">
                  {log.data}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
