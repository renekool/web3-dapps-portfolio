import React from 'react';
import { Landmark, ChevronRight, Copy, Clock, Check, Loader2 } from 'lucide-react';

import { DAOProposal, useDAOStore } from '@/lib/store/useDAOStore';
import { getProposalStatusLabel, getProposalStatusColor, formatRemainingTime, formatDeadline, calculateQuorum, calculateSupport, formatAddress } from '@/lib/proposalUtils';
import { VoteOptionCard } from './VoteOptionCard';

interface ProposalDetailProps {
  proposal: DAOProposal;
  onBack: () => void;
  onVote: (voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') => void;
  votingChoice: 'FOR' | 'AGAINST' | 'ABSTAIN' | null;
  onExecute: () => void;
  isExecuting: boolean;
}

export const ProposalDetail: React.FC<ProposalDetailProps> = ({
  proposal,
  onBack,
  onVote,
  votingChoice = null,
  onExecute,
  isExecuting,
}) => {
  const { blockchainTime, lastSyncTime } = useDAOStore();
  const [localTime, setLocalTime] = React.useState(blockchainTime);

  React.useEffect(() => {
    const update = () => {
      // Diferencia entre la hora actual de tu PC y la hora de la última sincronización
      const elapsed = Math.floor(Date.now() / 1000) - lastSyncTime;
      // El tiempo real estimado = Tiempo de la DAO al sincronizarse + tiempo pasado
      setLocalTime(blockchainTime + Math.max(0, elapsed));
    };

    const timer = setInterval(update, 1000);
    update(); // actualización inicial inmediata
    return () => clearInterval(timer);
  }, [blockchainTime, lastSyncTime]);

  const isAnyVoting = !!votingChoice;
  const [mounted, setMounted] = React.useState(false);
  const [copiedProposer, setCopiedProposer] = React.useState(false);
  const [copiedRecipient, setCopiedRecipient] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async (text: string, type: 'proposer' | 'recipient') => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        if (type === 'proposer') {
          setCopiedProposer(true);
          setTimeout(() => setCopiedProposer(false), 2000);
        } else {
          setCopiedRecipient(true);
          setTimeout(() => setCopiedRecipient(false), 2000);
        }
      } else {
        // Fallback for non-secure contexts if needed
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        if (type === 'proposer') {
          setCopiedProposer(true);
          setTimeout(() => setCopiedProposer(false), 2000);
        } else {
          setCopiedRecipient(true);
          setTimeout(() => setCopiedRecipient(false), 2000);
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatVotes = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const formatId = (id: number) => `#${(id + 1).toString().padStart(3, '0')}`;

  const totalVotes = (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes);
  const support = calculateSupport(proposal);
  const quorum = calculateQuorum(proposal);
  
  const status = getProposalStatusLabel(proposal.state, proposal.deadline, localTime);
  
  // LOGIC ALIGNED WITH DAOVoting.sol:
  // 1. Quorum: (FOR + AGAINST) >= 30% of totalDepositedAtCreation
  // 2. Majority: FOR > 60% of (FOR + AGAINST)
  const isPassing = support > 60 && quorum >= 30;

  const forPct = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPct = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
  const abstainPct = totalVotes > 0 ? (proposal.abstainVotes / totalVotes) * 100 : 0;

  const isTimelockActive = status === 'ENDED' && isPassing && localTime < proposal.timelockDeadline;
  const isFailed = status === 'ENDED' && !isPassing;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500">
        <button 
          onClick={onBack}
          className="hover:text-dark-green hover:bg-slate-50 px-2 py-1 -ml-2 rounded-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          Governance
        </button>
        <ChevronRight className="size-4 text-slate-400" />
        <span className="text-slate-900">Proposal {formatId(proposal.id)}</span>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
        {/* Proposal Header */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center justify-center rounded-full border px-4 h-6 text-xs font-bold uppercase tracking-wider leading-none transition-colors ${getProposalStatusColor(status).split(' ring-')[0]}`}>
              {status}
            </div>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Clock className="size-4 text-slate-400" />
                <span className="text-slate-400">Remaining: <span className="text-emerald-600 font-bold">{formatRemainingTime(proposal.deadline, localTime)}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium border-l border-slate-200 pl-4 lg:pl-6">
                <div className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                  <Landmark className="size-4" />
                </div>
                <span className="text-slate-400">Requesting: <span className="text-emerald-700 font-bold">{proposal.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })} ETH</span></span>
              </div>
            </div>

          <h2 className="font-display text-3xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
            {formatId(proposal.id)}: {proposal.title}
          </h2>

          <div className="flex items-center flex-wrap gap-2.5 text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Proposer</span>
              <span className="font-mono text-slate-900">{formatAddress(proposal.proposer)}</span>
              <button 
                onClick={() => handleCopy(proposal.proposer, 'proposer')}
                className="text-slate-400 hover:text-dark-green hover:bg-emerald-50 p-1.5 rounded-lg transition-all active:scale-[0.9] cursor-pointer"
                title="Copy Address"
              >
                {copiedProposer ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Recipient</span>
              <span className="font-mono text-slate-900">{formatAddress(proposal.recipient)}</span>
              <button 
                onClick={() => handleCopy(proposal.recipient, 'recipient')}
                className="text-slate-400 hover:text-dark-green hover:bg-emerald-50 p-1.5 rounded-lg transition-all active:scale-[0.9] cursor-pointer"
                title="Copy Address"
              >
                {copiedRecipient ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Voting ends: <span className="text-slate-900 font-mono tracking-tight">{formatDeadline(proposal.deadline)}</span></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left Column: Details */}
          <div className="lg:col-span-3 p-8 flex flex-col">
            <h3 className="font-display text-xl font-bold text-slate-900 mb-6">
              Intent & Description
            </h3>
            <div className="prose prose-slate max-w-none mb-12 flex-1 text-slate-600 leading-relaxed">
              <p className="whitespace-pre-wrap">
                {proposal.description}
              </p>
            </div>
          </div>

          {/* Right Column: Voting Metrics & Actions */}
          <div className="lg:col-span-2 p-8 bg-slate-50/50 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-display text-xl font-bold text-slate-900">
                Voting Metrics
              </h3>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${isPassing ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isPassing ? 'PASSING' : 'FAILING'}
              </div>
            </div>
            
            <div className="space-y-8 mb-10">
              {/* Quorum */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-slate-900">Quorum Status</span>
                  <span className="font-medium text-slate-600">{quorum.toFixed(2)}% / 30%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden mb-2">
                  <div 
                    className="h-full bg-dark-green rounded-full" 
                    style={{ width: `${Math.min((quorum / 30) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <p>Target quorum: 30%</p>
                  <p className="font-medium">Participation: {formatVotes(totalVotes)} votes cast</p>
                </div>
              </div>

              {/* Voting Distribution Area */}
              <div className="space-y-4">
                <VoteOptionCard
                  type="FOR"
                  title="For"
                  description="Support the proposal and its execution."
                  votes={formatVotes(proposal.forVotes)}
                  percentage={forPct}
                  isSelected={proposal.userVote === 1}
                  isVoting={votingChoice === 'FOR'}
                  isAnyVoting={isAnyVoting}
                  onVote={() => onVote('FOR')}
                  canVote={status === 'ACTIVE'}
                />

                <VoteOptionCard
                  type="AGAINST"
                  title="Against"
                  description="Oppose the proposal and its execution."
                  votes={formatVotes(proposal.againstVotes)}
                  percentage={againstPct}
                  isSelected={proposal.userVote === 2}
                  isVoting={votingChoice === 'AGAINST'}
                  isAnyVoting={isAnyVoting}
                  onVote={() => onVote('AGAINST')}
                  canVote={status === 'ACTIVE'}
                />

                <VoteOptionCard
                  type="ABSTAIN"
                  title="Abstain"
                  description="Signal presence without affecting the outcome."
                  votes={formatVotes(proposal.abstainVotes)}
                  percentage={abstainPct}
                  isSelected={proposal.userVote === 0}
                  isVoting={votingChoice === 'ABSTAIN'}
                  isAnyVoting={isAnyVoting}
                  onVote={() => onVote('ABSTAIN')}
                  canVote={status === 'ACTIVE'}
                />

                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center px-1">
                  <span className="font-bold text-slate-900 text-sm">Total votes</span>
                  <span className="font-bold text-slate-900 text-sm">{formatVotes(totalVotes)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Status Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <Clock className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {status === 'ACTIVE' ? 'Voting Period Open' : 
                 status === 'ENDED' ? (isPassing ? 'Time-lock Period Active' : 'Proposal Failed') : 
                 status === 'EXECUTED' ? 'Successfully Executed' : 'Proposal Terminated'}
              </h4>
              <p className="text-xs text-slate-500">
                {status === 'ACTIVE' ? `Voting ends in ${formatRemainingTime(proposal.deadline, localTime)}` :
                  status === 'ENDED' ? (isPassing ? `Execution available in ${formatRemainingTime(proposal.timelockDeadline, localTime)}` : 'Did not meet governance requirements.') :
                 `Final state reached.`}
              </p>
            </div>
          </div>
          <button 
            disabled={status !== 'ENDED' || !isPassing || isExecuting || isTimelockActive}
            onClick={onExecute}
            className={`w-full sm:w-auto px-6 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 ${status === 'ENDED' && isPassing && !isTimelockActive ? 'bg-dark-green text-white hover:bg-opacity-90 active:scale-95 shadow-lg shadow-dark-green/20 cursor-pointer' : 'bg-slate-200 text-slate-600 cursor-not-allowed'} ${isExecuting ? 'opacity-70' : ''}`}
          >
            {isExecuting && <Loader2 className="size-4 animate-spin" />}
            <span>
              {isExecuting ? 'Processing...' : 
               isFailed ? 'Proposal Failed' : 
               isTimelockActive ? `Timelock: ${formatRemainingTime(proposal.timelockDeadline, localTime)}` : 
               'Execute Proposal'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
