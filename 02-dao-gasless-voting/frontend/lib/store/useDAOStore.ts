import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DAOProposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  recipient: string;
  amount: number;
  totalDepositedAtCreation: number;
  deadline: number; // Unix timestamp
  timelockDeadline: number; // Unix timestamp
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  userVote: number | null; // enum VoteType (0: Abstain, 1: For, 2: Against) or null
  state: number; // enum ProposalState (0: Pending, 1: Active, 2: Executed, 3: Failed)
  descriptionURI: string;
}

interface DAOState {
  // User & Wallet Slice
  address: string | null;
  votingPower: number; // Base value (e.g., 0.021 for 2.1%)
  hasMinimumWeight: boolean;
  isConnecting: boolean;
  isInitializing: boolean;
  gaslessPreference: boolean;
  blockchainTime: number;
  lastSyncTime: number;

  // Treasury Slice
  totalDeposited: number;
  userDeposit: number;

  // Proposals Slice
  proposals: DAOProposal[];

  // Actions
  connectMock: () => Promise<void>;
  disconnect: () => void;
  setTreasuryData: (total: number, user: number) => void;
  setProposals: (proposals: DAOProposal[]) => void;
  setAddress: (address: string | null) => void;
  resetWalletState: () => void;
  voteInStore: (proposalId: number, voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') => void;
  setInitializing: (val: boolean) => void;
  setGaslessPreference: (val: boolean) => void;
  setBlockchainTime: (val: number) => void;
}

export const useDAOStore = create<DAOState>()(
  persist(
    (set, get) => ({
      // Initial States
      address: null,
      votingPower: 0,
      hasMinimumWeight: false,
      isConnecting: false,
      totalDeposited: 0,
      userDeposit: 0,
      proposals: [],
      isInitializing: true,
      gaslessPreference: false,
      blockchainTime: Math.floor(Date.now() / 1000),
      lastSyncTime: Math.floor(Date.now() / 1000),

      // Actions
      connectMock: async () => {
        set({ isConnecting: true });
        await new Promise((resolve) => setTimeout(resolve, 800));
        set({
          address: '0xf39...266',
          votingPower: 0,
          hasMinimumWeight: false,
          isConnecting: false
        });
      },

      disconnect: () => {
        set({
          address: null,
          votingPower: 0,
          hasMinimumWeight: false,
          isConnecting: false
        });
      },

      resetWalletState: () => {
        console.log("[Store] Resetting wallet state...");
        set({
          address: null,
          votingPower: 0,
          userDeposit: 0,
          hasMinimumWeight: false,
          isConnecting: false
        });
      },

      setTreasuryData: (total, user) => set((state) => {
        const power = total > 0 ? user / total : 0;
        // setTreasuryData log removed
        return { 
          totalDeposited: total, 
          userDeposit: user,
          votingPower: power,
          hasMinimumWeight: power >= 0.01 // 1% threshold
        };
      }),

      setProposals: (proposals) => set({ proposals }),

      setAddress: (address) => {
        const currentAddress = get().address;
        
        if (address) {
          // Solamente resetear datos si la billetera ha cambiado realmente
          if (address !== currentAddress) {
            set({ 
              address, 
              userDeposit: 0,
              votingPower: 0,
              hasMinimumWeight: false
            });
          } else {
            // Si es la misma billetera, simplemente asegurar que el address esté seteado
            set({ address });
          }
        } else {
          set({ 
            address: null, 
            userDeposit: 0,
            votingPower: 0, 
            hasMinimumWeight: false 
          });
        }
      },

      voteInStore: (proposalId, voteType) => set((state) => ({
        // We no longer increment locally to avoid "fake" counts. 
        // Real synchronization is handled by Web3DataSync.
        proposals: state.proposals
      })),

      setInitializing: (val) => set({ isInitializing: val }),

      setGaslessPreference: (val) => set({ gaslessPreference: val }),

      setBlockchainTime: (val: number) => {
        const current = get().blockchainTime;
        if (val !== current) {
          set({ 
            blockchainTime: val,
            lastSyncTime: Math.floor(Date.now() / 1000)
          });
        }
      }
    }),
    {
      name: 'dao-governance-storage', // name of the item in the storage (must be unique)
    }
  )
);
