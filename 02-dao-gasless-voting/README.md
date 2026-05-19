# DAO Gasless Voting

A decentralized autonomous organization (DAO) platform that enables gasless voting and governance through meta-transactions. Built with Foundry (Solidity) and Next.js, this system allows users to participate in DAO governance without needing ETH for gas fees.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Gasless Mechanism](#gasless-mechanism)
- [Governance Flow](#governance-flow)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Design Decisions](#design-decisions)
- [Known Issues & Risks](#known-issues--risks)
- [Contributing](#contributing)

---

## Overview

DAO Gasless Voting is a full-stack Web3 application that implements a treasury-based governance system where:

- **Members deposit ETH** to gain voting power proportional to their contribution
- **Proposals** can be created to request funds from the treasury
- **Voting** is weighted by deposit percentage (1 token = 1 vote equivalent)
- **Gasless transactions** enable users without ETH to participate in governance
- **Timelock mechanism** ensures security before proposal execution

The system uses **EIP-712 typed data signatures** and a **relayer network** to enable meta-transactions, abstracting away gas fees from end users.

---

## Features

### Core Governance
- **Treasury Management**: Members deposit ETH to participate; treasury holds collective funds
- **Proposal Creation**: Any member with ≥1% of total deposits can create funding proposals
- **Weighted Voting**: Vote power is proportional to deposit percentage
- **Vote Modification**: Users can change their vote before the deadline
- **Quorum & Majority**: Proposals require 30% quorum and 60% majority to pass
- **Timelock Execution**: Approved proposals have a 1-day timelock before execution

### Gasless Infrastructure
- **Meta-Transactions**: Users sign typed data; relayer submits transactions on-chain
- **EIP-712 Compliance**: Standard signature format compatible with all major wallets
- **Relayer API**: Next.js API route handles transaction relay with validation
- **Fallback Mode**: Automatic fallback to direct transaction if relayer fails

### User Experience
- **Next.js 15 Frontend**: Modern React application with App Router
- **Wagmi v2 + Viem**: Type-safe Web3 hooks for Ethereum interactions
- **Real-time Sync**: Automatic blockchain state synchronization
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

---

## Architecture

### High-Level Architecture

<p align="center">
  <img src="./docs/assets/gasl-dao-arc.png" alt="High-Level Architecture" width="800">
</p>

### Data Flow Summary

| Step | Component | Action | Communication |
|------|-----------|--------|---------------|
| 1 | React UI | User initiates action (vote, deposit, propose) | — |
| 2 | useGasless Hook | Prepares calldata and requests signature | Internal |
| 3 | Wagmi | Signs EIP-712 typed data via wallet | Browser Extension |
| 4 | Frontend | Sends signed request to relayer | HTTP POST |
| 5 | Relayer API | Validates signature, nonce, whitelist | Internal |
| 6 | Relayer | Calls `MinimalForwarder.execute()` | RPC |
| 7 | MinimalForwarder | Verifies and forwards to DAOVoting | On-chain |
| 8 | DAOVoting | Executes target function | On-chain |
| 9 | Relayer | Returns transaction hash to frontend | HTTP Response |
| 10 | Frontend | Updates UI with confirmation | — |

---

## Tech Stack

### Smart Contracts
| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | ^0.8.20 | Smart contract language |
| Foundry | Latest | Development framework |
| OpenZeppelin | ^5.0 | Security libraries (ERC2771Context, ReentrancyGuard) |
| forge-std | Latest | Testing utilities |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | ^15.5.12 | React framework |
| React | ^19.2.1 | UI library |
| TypeScript | ^5.9.3 | Type safety |
| Wagmi | ^3.5.0 | Web3 React hooks |
| Viem | ^2.47.4 | Ethereum client |
| ethers.js | ^6.16.0 | Relayer implementation |
| Zustand | ^5.0.12 | State management |
| Tailwind CSS | ^4.1.11 | Styling |
| Framer Motion | ^11.15.0 | Animations |

### Development Tools
| Tool | Purpose |
|------|---------|
| Anvil | Local Ethereum node |
| Cast | Contract interaction CLI |
| Forge | Testing & deployment |

---

## Project Structure

```
02-dao-gasless-voting/
├── contracts/                    # Smart contract source code
│   ├── src/
│   │   ├── DAOVoting.sol         # Main governance contract
│   │   └── MinimalForwarder.sol  # EIP-712 meta-transaction forwarder
│   ├── script/
│   │   └── Deploy.s.sol          # Deployment script
│   ├── test/                     # Contract tests (if present)
│   ├── lib/                      # Dependencies (forge-std, openzeppelin)
│   ├── foundry.toml              # Foundry configuration
│   └── .env                      # Contract deployment variables
│
├── frontend/                     # Next.js application
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── dao/
│   │   │   └── page.tsx          # Main DAO dashboard
│   │   ├── api/
│   │   │   └── relay/
│   │   │       └── route.ts      # Relayer API endpoint
│   │   ├── layout.tsx            # Root layout
│   │   └── providers.tsx         # Web3 providers
│   ├── components/               # React components
│   │   ├── FeatureCard.tsx
│   │   ├── GovernanceCard.tsx
│   │   ├── DepositModal.tsx
│   │   ├── NewProposalModal.tsx
│   │   ├── ProposalsList.tsx
│   │   ├── ProposalDetail.tsx
│   │   ├── GaslessOverlay.tsx
│   │   └── GaslessToggle.tsx
│   ├── hooks/
│   │   └── useGasless.ts         # Gasless transaction hook
│   ├── context/
│   │   └── GaslessContext.tsx    # Gasless preference context
│   ├── lib/
│   │   ├── abi/                  # Contract ABIs (generated)
│   │   └── store/
│   │       └── useDAOStore.ts    # Zustand state management
│   ├── config/                   # App configuration
│   ├── .env.local                # Environment variables (generated)
│   ├── .env.example              # Environment template
│   ├── package.json              # Frontend dependencies
│   ├── next.config.ts            # Next.js configuration
│   ├── tailwind.config.ts        # Tailwind configuration
│   └── tsconfig.json             # TypeScript configuration
│
├── scripts/                      # Automation scripts
│   ├── deploy-local.sh           # Local deployment automation
│   ├── check-setup.sh            # Environment validation
│   ├── advance-time.sh           # Time manipulation for testing
│   └── warp-to-execute.sh        # Fast-forward to execution
│
├── openspec/                     # Specification documents
│   ├── config.yaml               # OpenSpec configuration
│   ├── specs/
│   │   ├── dao-core-governance/  # Governance specifications
│   │   ├── dao-gasless-meta-tx/  # Meta-transaction specs
│   │   ├── dao-ui-ux/            # UI/UX specifications
│   │   └── stabilization-learnings/ # Iteration notes
│
└── README.md                     # This documentation
```

---

## Smart Contracts

### DAOVoting Contract

**Address**: Deployed dynamically (see [`Deploy.s.sol`](contracts/script/Deploy.s.sol:10))

**Inheritance**: `ReentrancyGuard`, `ERC2771Context`

#### State Variables

| Variable | Type | Description |
|----------|------|-------------|
| [`deposits`](contracts/src/DAOVoting.sol:44) | `mapping(address => uint256)` | User deposit balances |
| [`totalDeposited`](contracts/src/DAOVoting.sol:45) | `uint256` | Total treasury balance |
| [`proposals`](contracts/src/DAOVoting.sol:47) | `Proposal[]` | Array of all proposals |
| [`receipts`](contracts/src/DAOVoting.sol:49) | `mapping(uint256 => mapping(address => VoteReceipt))` | Vote records per proposal |

#### Structs

```solidity
enum ProposalState { Pending, Active, Executed, Failed }
enum VoteType { Abstain, For, Against }

struct VoteReceipt {
    VoteType vote;
    uint256 weightVoted;
    bool hasVoted;
}

struct Proposal {
    address proposer;
    address recipient;
    uint256 amount;
    uint256 totalDepositedAtCreation;
    uint256 deadline;
    uint256 timelockDeadline;
    uint256 forVotes;
    uint256 againstVotes;
    uint256 abstainVotes;
    ProposalState state;
    string descriptionURI;
}
```

#### Key Functions

##### [`deposit()`](contracts/src/DAOVoting.sol:96)
```solidity
function deposit() public payable
```
Deposits ETH to gain voting power. First depositor must send ≥0.05 ETH; subsequent deposits must be ≥1% of current treasury.

##### [`createProposal()`](contracts/src/DAOVoting.sol:110)
```solidity
function createProposal(address target, uint256 reqAmount, string memory descriptionURI) public returns (uint256)
```
Creates a new funding proposal. Requires proposer to have ≥1% of total deposits. Maximum request is 25% of treasury.

##### [`vote()`](contracts/src/DAOVoting.sol:156)
```solidity
function vote(uint256 proposalId, VoteType voteOption) public
```
Casts or changes a vote on an active proposal. Weight equals user's deposit amount.

##### [`executeProposal()`](contracts/src/DAOVoting.sol:196)
```solidity
function executeProposal(uint256 proposalId) public nonReentrant
```
Executes a passed proposal after timelock. Requires:
- 30% quorum of `totalDepositedAtCreation`
- 60% majority of FOR votes (excluding abstentions)

---

### MinimalForwarder Contract

**Purpose**: EIP-712 meta-transaction forwarder for gasless execution

#### Key Functions

##### [`verify()`](contracts/src/MinimalForwarder.sol:63)
```solidity
function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool)
```
Verifies if a signature is valid for the given request.

##### [`execute()`](contracts/src/MinimalForwarder.sol:68)
```solidity
function execute(ForwardRequest calldata req, bytes calldata signature) external payable
```
Executes a meta-transaction after signature verification. Increments nonce on success.

##### [`getNonce()`](contracts/src/MinimalForwarder.sol:43)
```solidity
function getNonce(address from) public view returns (uint256)
```
Returns the next valid nonce for an address.

---

## Gasless Mechanism

### How It Works

The gasless mechanism uses **meta-transactions** to separate transaction initiation from transaction execution:

1. **User Signs**: User signs a typed data structure (EIP-712) containing the intended transaction
2. **Relayer Submits**: A relayer service (with ETH) submits the signed message to the blockchain
3. **Contract Executes**: The `MinimalForwarder` contract verifies the signature and executes the transaction

### EIP-712 Domain

```typescript
const domain = {
  name: 'MinimalForwarder',
  version: '1',
  chainId: chainId,
  verifyingContract: FORWARDER_ADDRESS,
};

const types = {
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
};
```

### Relayer API

The relayer is implemented as a Next.js API route at [`/api/relay`](frontend/app/api/relay/route.ts:26):

**Validations Performed**:
1. Relayer configuration check
2. Request/signature presence
3. Destination contract whitelist
4. Function selector whitelist (only `vote`, `createProposal`, `deposit`, `executeProposal`)
5. Gas limit validation (max 1,000,000)
6. Nonce validation (on-chain check)
7. Signature verification via `forwarder.verify()`
8. Relayer balance check (minimum 0.01 ETH)

**Response Format**:
```json
{
  "success": true,
  "txHash": "0x...",
  "status": "submitted",
  "relayerAddress": "0x..."
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `RELAYER_INSUFFICIENT_FUNDS` | Relayer balance below 0.01 ETH |
| `TIMEOUT` | Relayer did not respond within 30s |
| `NETWORK_ERROR` | Network communication failure |
| `INVALID_SIGNATURE` | Signature does not match request |
| `INVALID_NONCE` | Nonce does not match on-chain value |
| `EXECUTION_FAILED` | Transaction reverted on-chain |
| `WRONG_NETWORK` | Wallet connected to wrong chain |

---

## Governance Flow

### 1. Deposit Phase

```
User → deposit() → Treasury
       ↑
       │ Voting power = deposit / totalDeposited
```

- Minimum first deposit: 0.05 ETH (bootstrap)
- Subsequent deposits: ≥1% of current treasury
- Voting power is dynamic (changes with total deposits)

### 2. Proposal Creation

```
Requirements:
- Proposer has ≥1% of total deposits
- Request amount > 0
- Request ≤25% of treasury

Timeline:
- Voting period: 1 day (MIN_VOTING_DURATION)
- Timelock: 1 day (TIMELOCK_DURATION)
- Total: 2 days minimum until execution
```

### 3. Voting Process

```solidity
VoteType.For      → Supports proposal
VoteType.Against  → Opposes proposal
VoteType.Abstain  → Participates without taking side
```

- Users can change votes before deadline
- Changing vote removes old weight and adds new weight
- Only FOR and AGAINST votes count toward quorum/majority

### 4. Execution Conditions

A proposal passes when **both** conditions are met:

1. **Quorum**: `forVotes + againstVotes ≥ 30% of totalDepositedAtCreation`
2. **Majority**: `forVotes > 60% of (forVotes + againstVotes)`

After timelock passes, anyone can call [`executeProposal()`](contracts/src/DAOVoting.sol:196).

### 5. Failure States

Proposal fails if:
- Quorum not met
- Majority not met
- Timelock expires without execution (manual intervention may be needed)

---

## Installation & Setup

### Prerequisites

- **Node.js** v18+ and npm
- **Foundry** (install via `curl -L https://foundry.paradigm.xyz | bash`)
- **MetaMask** browser extension
- **Git**

### Quick Start

#### 1. Clone and Navigate

```bash
cd /home/rene/web3-dev/web3-dapps-portfolio/02-dao-gasless-voting
```

#### 2. Install Dependencies

```bash
# Install contract dependencies
cd contracts
forge install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 3. Start Local Blockchain

Open a new terminal:

```bash
anvil
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with pre-funded accounts.

#### 4. Deploy Contracts

Run the deployment script:

```bash
./scripts/deploy-local.sh
```

This script:
1. Verifies Anvil is running
2. Compiles contracts with `forge build`
3. Deploys `MinimalForwarder` and `DAOVoting`
4. Generates ABIs for frontend
5. Creates `frontend/.env.local` with contract addresses

#### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

#### 6. Configure MetaMask

1. Add Localhost network:
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Symbol: `ETH`

2. Import Anvil Account #1 (for gasless relayer testing):
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

### Environment Variables

#### Frontend `.env.local` (auto-generated)

```env
NEXT_PUBLIC_DAO_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
RELAYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RELAYER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

#### Contracts `.env`

```env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://127.0.0.1:8545
```

### Verification Script

Run the setup check:

```bash
./scripts/check-setup.sh
```

---

## Usage

### For End Users

#### Connect Wallet
1. Click "Connect Wallet" on the landing page
2. Approve MetaMask connection
3. Ensure you're on Localhost (Chain ID 31337)

#### Deposit to Treasury
1. Navigate to the DAO dashboard
2. Click "Deposit" button
3. Enter amount (minimum 0.05 ETH for first depositor)
4. Confirm transaction in MetaMask

#### Create Proposal
1. Ensure you have ≥1% voting power
2. Click "New Proposal"
3. Fill in:
   - Recipient address
   - Amount requested
   - Description (IPFS URI or text)
4. Submit (gasless or direct)

#### Vote on Proposals
1. Navigate to a proposal detail
2. Select vote option (For, Against, Abstain)
3. Sign message (gasless) or confirm transaction
4. Vote is recorded on-chain

#### Execute Proposal
1. After voting deadline + timelock has passed
2. Check proposal status shows "Executable"
3. Click "Execute" to transfer funds

### For Developers

#### Run Tests

```bash
cd contracts
forge test
```

#### Format Contracts

```bash
forge fmt
```

#### Deploy to Testnet

```bash
# Set environment variables
export RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
export PRIVATE_KEY=your_private_key

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY
```

#### Time Manipulation (Testing)

For testing proposal execution without waiting:

```bash
# Advance blockchain time by specified seconds
./scripts/advance-time.sh 172800  # Advance 2 days

# Fast-forward to execution time for a specific proposal
./scripts/warp-to-execute.sh 0    # For proposal ID 0
```

---

## API Reference

### Relayer API

#### POST `/api/relay`

Submits a signed meta-transaction for relay.

**Request Body**:
```json
{
  "request": {
    "from": "0x...",
    "to": "0x...",
    "value": "0",
    "gas": "1000000",
    "nonce": "0",
    "data": "0x..."
  },
  "signature": "0x..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "txHash": "0x...",
  "status": "submitted",
  "relayerAddress": "0x..."
}
```

**Error Responses**:

| Status | Body |
|--------|------|
| 400 | `{"error": "INVALID_NONCE", "details": "Expected 5, got 3"}` |
| 400 | `{"error": "INVALID_SIGNATURE"}` |
| 403 | `{"error": "Function not whitelisted"}` |
| 500 | `{"error": "EXECUTION_FAILED", "details": "..."}` |
| 503 | `{"error": "RELAYER_INSUFFICIENT_FUNDS", "details": "..."}` |

---

## Design Decisions

### 1. Treasury-Based Voting Power

**Decision**: Voting power is proportional to ETH deposit percentage, not a separate token.

**Rationale**:
- Simpler than ERC20 governance tokens
- Direct economic alignment with treasury
- No inflation or token distribution complexity

**Trade-off**: Voting power changes as others deposit/withdraw (if withdrawal were enabled).

### 2. ERC2771Context for Gasless

**Decision**: Use OpenZeppelin's `ERC2771Context` pattern.

**Rationale**:
- Standard approach for meta-transactions
- `_msgSender()` abstraction makes contracts agnostic to execution method
- Compatible with existing OpenZeppelin contracts

### 3. Function Whitelist in Relayer

**Decision**: Relayer only allows specific function selectors.

**Rationale**:
- Prevents malicious contract calls through relayer
- Limits relayer liability and gas exposure
- Explicit control over gasless capabilities

**Whitelisted Functions**:
- `vote(uint256,uint8)` - `0x943e8216`
- `createProposal(address,uint256,string)` - `0xcca5a8b2`
- `deposit()` - `0xd0e30db0`
- `executeProposal(uint256)` - `0x0d61b519`

### 4. Quorum Based on `totalDepositedAtCreation`

**Decision**: Quorum is calculated against treasury at proposal creation time.

**Rationale**:
- Prevents quorum manipulation after proposal is created
- Provides certainty to proposers about requirements
- Snapshot-like behavior without complexity

### 5. Vote Changeability

**Decision**: Users can change their vote before deadline.

**Rationale**:
- Allows users to respond to new information
- More democratic governance
- Implemented by subtracting old vote weight before adding new

### 6. Next.js API Route as Relayer

**Decision**: Use serverless-style API route instead of standalone relayer service.

**Rationale**:
- Simpler deployment (no separate infrastructure)
- Integrated with frontend codebase
- Easier to secure with API keys or auth

**Trade-off**: Relayer stops if frontend is not running (acceptable for local dev).

### 7. Zustand for State Management

**Decision**: Use Zustand instead of Redux or Context.

**Rationale**:
- Minimal boilerplate
- Built-in persistence via `zustand/middleware`
- Works well with Wagmi's query-based approach

---

## Known Issues & Risks

### Security Considerations

#### 1. Relayer Centralization
**Risk**: Single relayer address controls all gasless transactions.

**Mitigation**:
- Relayer is permissioned (private key controlled)
- For production, consider multi-relayer setup with rotation

#### 2. Relayer Front-Running
**Risk**: Relayer could potentially front-run user transactions.

**Mitigation**:
- Relayer code is open source and auditable
- Nonce mechanism prevents replay attacks

#### 3. No Withdrawal Mechanism
**Risk**: Users cannot withdraw deposits.

**Current State**: Deposits are permanent. This is by design for treasury stability but should be documented clearly.

**Recommendation**: Consider adding withdrawal proposal mechanism for treasury governance.

#### 4. Reentrancy Protection
**Status**: `executeProposal()` uses `nonReentrant` modifier.

**Note**: `deposit()` does not have reentrancy guard since it only modifies internal state before external call (which doesn't exist in this case).

### Technical Debt

#### 1. Hardcoded Gas Limit
**Location**: [`useGasless.ts:104`](frontend/hooks/useGasless.ts:104)

```typescript
gas: BigInt(1000000), // Secure limit
```

**Risk**: May be insufficient for complex proposals or gas price spikes.

**Recommendation**: Implement dynamic gas estimation.

#### 2. Relayer Balance Check
**Location**: [`route.ts:87`](frontend/app/api/relay/route.ts:87)

```typescript
const minBalance = ethers.parseEther('0.01');
```

**Risk**: Fixed minimum may not reflect actual gas needs.

**Recommendation**: Calculate minimum based on pending transaction queue.

#### 3. Time Manipulation Scripts
**Location**: [`advance-time.sh`](scripts/advance-time.sh), [`warp-to-execute.sh`](scripts/warp-to-execute.sh)

**Risk**: Scripts use `anvil` RPC methods that won't work on production networks.

**Note**: These are development-only tools and should not be used in production.

### Potential Inconsistencies

#### 1. Frontend `.env.example` Mismatch
**Issue**: The [`frontend/.env.example`](frontend/.env.example:1) file contains Gemini AI configuration, not the actual required variables for the DAO app.

**Expected Content**:
```env
NEXT_PUBLIC_DAO_CONTRACT_ADDRESS=
NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS=
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
RELAYER_PRIVATE_KEY=
```

#### 2. Store Synchronization
**Issue**: Vote counts in [`useDAOStore`](frontend/lib/store/useDAOStore.ts:140) are not updated locally; synchronization depends on external `Web3DataSync` (not found in codebase).

**Recommendation**: Implement polling or event-based sync for proposal state.

#### 3. Chain ID Hardcoding
**Location**: [`page.tsx:74`](frontend/app/dao/page.tsx:74)

```typescript
const isWrongNetwork = chainId !== 31337;
```

**Risk**: Requires code change for production deployment.

**Recommendation**: Use environment variable `NEXT_PUBLIC_CHAIN_ID`.

---

## Contributing

### Development Workflow

1. **Fork and Clone** the repository
2. **Create a Branch** for your feature
3. **Make Changes** following existing patterns
4. **Run Tests** (`forge test` and frontend checks)
5. **Submit PR** with clear description

### Code Style

#### Solidity
- Follow Solidity 0.8+ best practices
- Use NatSpec comments for public functions
- Run `forge fmt` before committing

#### TypeScript/React
- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks

### Commit Messages

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes

---

## License

MIT License - See LICENSE file for details.

---

## Author

Created and maintained by **René Orellana**.

---

## Contact

If you have questions, suggestions, or would like to collaborate, you can contact:

**René Orellana**  
Email: t4mmg120@hotmail.com
