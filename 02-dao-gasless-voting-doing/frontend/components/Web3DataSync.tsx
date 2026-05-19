'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContracts, useBlock, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { useDAOStore, DAOProposal } from '@/lib/store/useDAOStore';
import DAOVotingABI from '@/lib/abi/DAOVoting.json';

const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

export function Web3DataSync() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { 
    setTreasuryData, 
    setAddress, 
    setProposals, 
    setBlockchainTime, 
    totalDeposited: storeTotalDeposited, 
    resetWalletState 
  } = useDAOStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const { data: block } = useBlock({
    watch: true,
    query: {
      refetchInterval: 2500,
    }
  });

  useEffect(() => {
    if (block?.timestamp) {
      setBlockchainTime(Number(block.timestamp));
    }
  }, [block, setBlockchainTime]);

  const { data: contractData } = useReadContracts({
    contracts: [
      {
        address: DAO_ADDRESS,
        abi: DAOVotingABI as any,
        functionName: 'totalDeposited',
      },
      {
        address: DAO_ADDRESS,
        abi: DAOVotingABI as any,
        functionName: 'deposits',
        args: [address as `0x${string}`],
      },
      {
        address: DAO_ADDRESS,
        abi: DAOVotingABI as any,
        functionName: 'getProposalsCount',
      },
    ],
    query: {
      enabled: !!DAO_ADDRESS && isConnected && !!address,
      refetchInterval: 2500, // Faster sync for local dev
    }
  });

  // --- Chain Reset Detection (Session Sanitizer) ---
  // If we are on local network (31337) and we have data in store but the contract is empty (0),
  // it means Anvil was restarted. We MUST clear the stale session to avoid nonce/UI desync.
  useEffect(() => {
    if (!isMounted || !isConnected || !address || chainId !== 31337) return;

    const checkChainReset = () => {
      // Small delay to ensure contractData is populated
      if (storeTotalDeposited > 0 && contractData?.[0]?.result === BigInt(0)) {
        console.warn("[Web3DataSync] Local Anvil Reset Detected. Purging stale store session...");
        resetWalletState();
      }
    };
    
    checkChainReset();
  }, [contractData, storeTotalDeposited, isConnected, address, chainId, resetWalletState, isMounted]);

  // 2. Conditional fetch for ALL proposals
  const proposalsCount = contractData?.[2]?.result ? Number(contractData[2].result) : 0;
  
  const { data: proposalsDetailsData } = useReadContracts({
    contracts: Array.from({ length: proposalsCount }).flatMap((_, i) => [
      {
        address: DAO_ADDRESS,
        abi: DAOVotingABI as any,
        functionName: 'proposals',
        args: [BigInt(i)],
      },
      {
        address: DAO_ADDRESS,
        abi: DAOVotingABI as any,
        functionName: 'receipts',
        args: [BigInt(i), address as `0x${string}`],
      }
    ]),
    query: {
      enabled: proposalsCount > 0,
       refetchInterval: 2500, // Faster sync for local dev
    }
  });

  useEffect(() => {
    if (!isMounted) return;
    if (contractData) {
      const [totalDepRaw, userDepRaw] = contractData;
      
      const total = totalDepRaw?.result ? parseFloat(formatEther(totalDepRaw.result as bigint)) : 0;
      const user = userDepRaw?.result ? parseFloat(formatEther(userDepRaw.result as bigint)) : 0;

      setTreasuryData(total, user);
    }
  }, [contractData, setTreasuryData, proposalsCount, isMounted]);

  // Handle Proposals update
  useEffect(() => {
    if (!isMounted) return;
    if (proposalsCount === 0) {
      setProposals([]);
      return;
    }

    if (proposalsDetailsData && proposalsDetailsData.length > 0) {
      const formatted: DAOProposal[] = [];
      
      for (let i = 0; i < proposalsCount; i++) {
        const pRaw = proposalsDetailsData[i * 2];
        const rRaw = proposalsDetailsData[i * 2 + 1];
        
        if (!pRaw?.result) continue;
        
        const [
          proposer, 
          recipient, 
          amount, 
          totalDepositedAtCreation, 
          deadline, 
          timelockDeadline, 
          forVotes, 
          againstVotes, 
          abstainVotes,
          state, 
          descriptionURI
        ] = pRaw.result as any;

        let userVote = null;
        if (rRaw?.result) {
          const [voteType, weightVoted, hasVoted] = rRaw.result as any;
          if (hasVoted) userVote = Number(voteType);
        }

        formatted.push({
          id: i,
          proposer,
          recipient,
          amount: parseFloat(formatEther(amount)),
          totalDepositedAtCreation: parseFloat(formatEther(totalDepositedAtCreation)),
          deadline: Number(deadline),
          timelockDeadline: Number(timelockDeadline),
          forVotes: parseFloat(formatEther(forVotes)),
          againstVotes: parseFloat(formatEther(againstVotes)),
          abstainVotes: parseFloat(formatEther(abstainVotes)),
          userVote,
          state: Number(state),
          descriptionURI: descriptionURI || "",
          title: descriptionURI?.split('|')?.[0] || `Proposal #${i}`,
          description: descriptionURI?.split('|')?.[1] || "No description provided."
        });
      }
      
      setProposals(formatted as any);
    }
  }, [proposalsDetailsData, proposalsCount, setProposals, isMounted]);

  // Sync wallet address to store
  useEffect(() => {
    if (!isMounted) return;
    if (isConnected && address) {
      setAddress(address);
    }
  }, [isConnected, address, setAddress, isMounted]);

  return null;
}
