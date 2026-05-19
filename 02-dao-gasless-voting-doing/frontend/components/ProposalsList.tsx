import React from 'react';
import { Search, ChevronDown, PlusCircle, Inbox, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { DAOProposal } from '@/lib/store/useDAOStore';
import { getProposalStatusLabel, getProposalStatusColor, formatRemainingTime, calculateSupport, calculateQuorum } from '@/lib/proposalUtils';

interface ProposalsListProps {
  proposals: DAOProposal[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  currentPage: number;
  setCurrentPage: (val: number | ((prev: number) => number)) => void;
  selectedFilter: string;
  setSelectedFilter: (val: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (val: boolean) => void;
  selectedSort: string;
  setSelectedSort: (val: string) => void;
  isSortOpen: boolean;
  setIsSortOpen: (val: boolean) => void;
  onNewProposal: () => void;
  onSelectProposal: (proposal: DAOProposal) => void;
  filterRef: React.RefObject<HTMLDivElement | null>;
  sortRef: React.RefObject<HTMLDivElement | null>;
  filterType: 'all' | 'mine' | 'others';
  setFilterType: (val: 'all' | 'mine' | 'others') => void;
  userAddress: string | null;
  blockchainTime: number;
}

export const ProposalsList: React.FC<ProposalsListProps> = ({
  proposals,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  selectedFilter,
  setSelectedFilter,
  isFilterOpen,
  setIsFilterOpen,
  selectedSort,
  setSelectedSort,
  isSortOpen,
  setIsSortOpen,
  onNewProposal,
  onSelectProposal,
  filterRef,
  sortRef,
  filterType,
  setFilterType,
  userAddress,
  blockchainTime
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use toLocaleString only when mounted
  const formatVotes = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatId = (id: number) => `#${(id + 1).toString().padStart(3, '0')}`;

  // Logic inside the component
  const filteredProposals = proposals
    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(p => {
      if (selectedFilter === 'All Proposals') return true;
      const status = getProposalStatusLabel(p.state, p.deadline, blockchainTime);
      return status === selectedFilter.toUpperCase();
    })
    .filter(p => {
      if (filterType === 'all') return true;
      const isProposer = p.proposer?.toLowerCase() === userAddress?.toLowerCase();
      const hasVoted = p.userVote !== null;
      const isMine = isProposer || hasVoted;
      
      if (filterType === 'mine') return isMine;
      if (filterType === 'others') return !isMine;
      return true;
    })
    .sort((a, b) => {
      if (selectedSort === 'Descending') return -1; // Basic placeholder for sort logic
      return 1;
    });

  const totalPages = Math.ceil(filteredProposals.length / 5) || 1;
  const paginatedProposals = filteredProposals.slice((currentPage - 1) * 5, currentPage * 5);

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-slate-900 mb-1.5">Proposals List</h3>
          <p className="text-sm text-slate-500">Browse, filter, and participate in governance proposals.</p>
        </div>
        
        {/* Segmented Control Filter */}
        <div className="flex bg-slate-100/50 p-1 rounded-xl relative">
          {[
            { id: 'all', label: 'All' },
            { id: 'mine', label: 'Mine' },
            { id: 'others', label: 'Others' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterType(tab.id as any);
                setCurrentPage(1);
              }}
              className={`relative px-4 py-1.5 text-sm font-medium transition-colors duration-200 z-10 cursor-pointer ${
                filterType === tab.id ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {filterType === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-lg border border-slate-200/50"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-20">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {/* Header & Controls */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            {/* Left Block: Filter & Sort */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  <span className="text-sm text-slate-500 font-medium">Filter:</span>
                  <span className="text-sm font-bold text-slate-700">{selectedFilter}</span>
                  <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 z-50 overflow-hidden border border-slate-100"
                    >
                      <div className="p-1">
                        {['All Proposals', 'Active', 'Executed', 'Cancelled'].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSelectedFilter(option);
                              setIsFilterOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFilter === option ? 'bg-primary/10 text-dark-green font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortRef}>
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  <span className="text-sm text-slate-500 font-medium">Sort By:</span>
                  <span className="text-sm font-bold text-slate-700">{selectedSort}</span>
                  <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 z-50 overflow-hidden border border-slate-100"
                    >
                      <div className="p-1">
                        {['Ascending', 'Descending'].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSelectedSort(option);
                              setIsSortOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSort === option ? 'bg-primary/10 text-dark-green font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Block: Search & New Proposal */}
            <div className="flex items-center gap-4 shrink-0 flex-1 justify-end">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search for proposals..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dark-green/30 focus:border-dark-green focus:ring-offset-1 transition-all duration-200 text-sm" 
                />
              </div>
              <button 
                onClick={onNewProposal}
                className="flex items-center justify-center gap-2 rounded-lg bg-dark-green px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-opacity-90 hover:shadow-md active:scale-[0.98] shrink-0 whitespace-nowrap cursor-pointer"
              >
                New Proposal <PlusCircle className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid Container */}
        <div>
          {filteredProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-6 border border-slate-100">
                <Inbox className="size-8 text-slate-400" />
              </div>
              <h4 className="font-display text-xl font-bold text-slate-900 mb-2">
                {filterType === 'mine' ? 'No proposals yet' : 'No proposals found'}
              </h4>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                {filterType === 'mine' 
                  ? "You haven't created any proposals yet." 
                  : filterType === 'others'
                    ? "Other users haven't created any proposals yet."
                    : searchQuery 
                      ? 'Try adjusting your search query.' 
                      : 'There are no active proposals right now.'}
              </p>
              {filterType === 'mine' && (
                <button
                  onClick={onNewProposal}
                  className="flex items-center gap-2 rounded-lg bg-dark-green px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-opacity-90 active:scale-[0.98] cursor-pointer"
                >
                  Create New Proposal <PlusCircle className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-[4fr_2fr_2fr_1fr_1fr_1fr_1fr_0.4fr] gap-4 px-6 lg:px-8 py-4 border-b border-slate-100 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/50">
                    <div className="min-w-0">Proposal</div>
                    <div className="text-center">State</div>
                    <div className="text-center">Due Date</div>
                    <div className="text-right">For</div>
                    <div className="text-right">Against</div>
                    <div className="text-right">Abstain</div>
                    <div className="text-center">Voting</div>
                    <div></div>
                  </div>

                  {/* Table Body */}
                  <div className="bg-white">
                    {paginatedProposals.map((proposal) => (
                      <div 
                        key={proposal.id} 
                        onClick={() => onSelectProposal(proposal)}
                        className="group px-6 lg:px-8 py-4 transition-colors duration-150 hover:bg-slate-50/80 cursor-pointer border-b border-slate-100/60 last:border-b-0"
                      >
                        <div className="grid grid-cols-[4fr_2fr_2fr_1fr_1fr_1fr_1fr_0.4fr] items-center gap-4">
                          <div className="font-medium text-slate-900 flex items-center gap-3 min-w-0">
                            <span className="truncate">{formatId(proposal.id)}: {proposal.title}</span>
                          </div>
                          <div className="flex justify-center">
                            {(() => {
                              const status = getProposalStatusLabel(proposal.state, proposal.deadline, blockchainTime);
                              const colorClass = getProposalStatusColor(status);
                              return (
                                <span className={`relative flex items-center justify-center rounded-full border w-20 h-5 text-[10px] font-bold uppercase transition-colors overflow-hidden ${colorClass.split(' ring-')[0]}`}>
                                  <span className={`absolute left-2 size-1 rounded-full ${colorClass.split(' ')[2].replace('text-', 'bg-')}`}></span>
                                  <span className="leading-none">{status}</span>
                                </span>
                              );
                            })()}
                          </div>
                          <div className="text-[13px] text-slate-600 text-center">
                            {formatRemainingTime(proposal.deadline, blockchainTime)}
                          </div>
                          <div className="text-right text-sm text-slate-600">
                            {formatVotes(proposal.forVotes)}
                          </div>
                          <div className="text-right text-sm text-slate-600">
                            {formatVotes(proposal.againstVotes)}
                          </div>
                          <div className="text-right text-sm text-slate-600">
                            {formatVotes(proposal.abstainVotes)}
                          </div>
                          <div className="flex justify-center">
                            {(() => {
                                const support = calculateSupport(proposal);
                                const quorum = calculateQuorum(proposal);
                                const isPassing = support > 60 && quorum >= 30;
                                return (
                                  <span className={`flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isPassing ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {isPassing ? 'PASSING' : 'FAILING'}
                                  </span>
                                );
                            })()}
                          </div>
                          <div className="flex justify-end">
                            <div
                              className="flex items-center justify-center size-8 rounded-full text-slate-600 group-hover:text-dark-green group-hover:bg-dark-green/10 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                              title="View Proposal"
                            >
                              <ArrowUpRight className="size-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between border-t border-slate-100 px-8 py-4 gap-4 bg-white">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900">{Math.min((currentPage - 1) * 5 + 1, filteredProposals.length)}-{Math.min(currentPage * 5, filteredProposals.length)}</span> of <span className="font-medium text-slate-900">{filteredProposals.length}</span> proposals
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center size-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex items-center justify-center size-8 rounded-lg text-sm font-semibold cursor-pointer ${currentPage === page ? 'bg-dark-green text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center size-8 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
