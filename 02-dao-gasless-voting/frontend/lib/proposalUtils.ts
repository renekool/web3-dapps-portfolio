import { DAOProposal } from "./store/useDAOStore";

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Executed = 2,
  Failed = 3,
}

export const getProposalStatusLabel = (state: number, deadline: number, customNow?: number) => {
  const now = customNow || Math.floor(Date.now() / 1000);
  
  if (state === ProposalState.Executed) return "EXECUTED";
  if (state === ProposalState.Failed) return "FAILED";
  
  if (now > deadline) {
    if (state === ProposalState.Active) return "ENDED";
    return "EXPIRED";
  }
  
  if (state === ProposalState.Active) return "ACTIVE";
  return "PENDING";
};

export const getProposalStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500";
    case "EXECUTED":
      return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500";
    case "FAILED":
    case "EXPIRED":
      return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 ring-slate-500";
  }
};

export const formatRemainingTime = (deadline: number, customNow?: number) => {
  const now = customNow || Math.floor(Date.now() / 1000);
  const diff = deadline - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  const seconds = (diff % 60).toString().padStart(2, '0');

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const formatAddress = (address: string | null | undefined) => {
  if (!address) return "0x000...000";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const calculateQuorum = (proposal: DAOProposal) => {
  // Logic: Quorum = (For + Against) / TreasuryAtCreation
  const totalDecisionVotes = proposal.forVotes + proposal.againstVotes;
  if (proposal.totalDepositedAtCreation === 0) return 0;
  return (totalDecisionVotes / proposal.totalDepositedAtCreation) * 100;
};

export const calculateSupport = (proposal: DAOProposal) => {
  // Logic: Support % = For / (For + Against)
  const totalDecisionVotes = proposal.forVotes + proposal.againstVotes;
  if (totalDecisionVotes === 0) return 0;
  return (proposal.forVotes / totalDecisionVotes) * 100;
};
export const formatDeadline = (deadline: number) => {
  const date = new Date(deadline * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};
