# Web3 Document Signature & Verification System

**Truxign** — A decentralized application for secure document timestamping and cryptographic signing on the Ethereum blockchain.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Project Objective](#project-objective)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Application Workflow](#application-workflow)
- [Project Structure](#project-structure)
- [Smart Contract Overview](#smart-contract-overview)
- [Frontend Features](#frontend-features)
- [Governance and Specifications](#governance-and-specifications)
- [Future Improvements](#future-improvements)

---

## Project Overview

**Truxign** is a Web3 system that enables users to establish cryptographic proof of document ownership and authenticity through blockchain technology. The system allows users to:

- Upload documents securely
- Generate cryptographic hashes (keccak256)
- Sign documents using an Ethereum wallet
- Store signed proofs on the blockchain
- Verify document authenticity at any time
- Explore document history through an intuitive interface

### The Problem

In traditional document verification systems:

- Documents can be altered without detection
- Timestamps can be manipulated
- Ownership claims lack cryptographic proof
- Centralized authorities are required for verification

### The Solution

Truxign leverages blockchain immutability to provide:

- **Tamper-proof records**: Once stored, document hashes cannot be modified
- **Cryptographic ownership**: Digital signatures prove who signed a document
- **Trustless verification**: Anyone can verify documents without relying on a central authority
- **Permanent timestamps**: Blockchain records provide indisputable proof of existence at a specific time

### General Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │───▶│  Smart Contract  │────▶│   Blockchain    │
│   (Next.js DApp)│     │  (Solidity)      │     │   (Anvil/EVM)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
  - File Upload          - Store Hash            - Immutable
  - Hash Generation      - Record Signer         - Decentralized
  - Wallet Signature     - Emit Events           - Transparent
  - Verification         - Query Documents       - Verifiable
```

---

## Project Objective

The main objectives of this project are:

1. **Trustless Document Verification**: Enable anyone to verify document authenticity without relying on a central authority.

2. **Cryptographic Ownership Proof**: Provide users with cryptographic evidence that they signed a specific document at a specific time.

3. **Blockchain-Based Registry**: Create an immutable, transparent registry of document hashes that cannot be altered or deleted.

4. **Local Development Focus**: Enable full functionality using local blockchain (Anvil) for development and testing without requiring testnet or mainnet deployment.

5. **Spec-Driven Development**: Follow a specification-first approach where the functional specification (`spec.md`) serves as the single source of truth.

---

## Key Features

### Document Upload
- Drag-and-drop or click-to-upload interface
- Support for any file type
- Client-side file processing (no server upload required)
- Document categorization (Legal, Financial, Identity, Other)

### Hash Generation
- Automatic keccak256 hash calculation using ethers.js
- Deterministic hashing ensures identical files produce identical hashes
- Hash displayed to user before signing

### Digital Signature via Wallet
- Personal signature request using `personal_sign`
- Message format: `Signing document with hash: [hash]`
- User must explicitly approve signature in wallet
- Signature rejection handling with graceful fallback

### Blockchain Storage
- Transaction submission to store document metadata on-chain
- Stored data includes: hash, timestamp, signer address, signature, filename, category
- Duplicate prevention (reverts if hash already exists)
- Transaction receipt with confirmation

### Document Verification
- Recalculate hash from uploaded file
- Retrieve stored data from blockchain
- Verify signature matches stored signer address
- Clear valid/invalid result display

### Document History
- Query all stored documents from the contract
- Display document metadata (hash, signer, timestamp, category)
- Pagination support for large document sets

---

## System Architecture

The system follows a three-layer architecture:

### Layer 1: Frontend (DApp)

**Technology Stack:**
- Next.js 14+ with App Router
- TypeScript (strict mode)
- Tailwind CSS for styling
- Ethers.js v6 for blockchain interaction
- React Context for state management

**Responsibilities:**
- User interface and user experience
- File handling and hash calculation (off-chain)
- Wallet connection and signature requests
- Transaction submission and confirmation
- Data visualization

### Layer 2: Smart Contracts

**Technology Stack:**
- Solidity ^0.8.20
- Foundry (Forge, Cast, Anvil)
- forge-std for testing

**Responsibilities:**
- Document hash storage
- Signer address recording
- Timestamp management
- Event emission for off-chain tracking
- Duplicate prevention

### Layer 3: Blockchain Network

**Current Environment:**
- Anvil local blockchain (Chain ID: 31337)
- Pre-funded test accounts
- Instant transaction confirmation

**Future Environments:**
- Ethereum testnets (Sepolia, Holesky)
- Ethereum mainnet
- L2 networks (Optimism, Arbitrum, Base)

---

## Application Workflow

The complete workflow from document upload to verification:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │  1. Upload   │
  │   Document   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  2. Generate │
  │  SHA-256     │
  │    Hash      │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  3. Sign     │
  │  with Wallet │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  4. Store    │
  │   on         │
  │  Blockchain  │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  5. Verify   │
  │   Document   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  6. Explore  │
  │   History    │
  └──────────────┘
```

### Step-by-Step Description

1. **Upload Document**: User selects a file via drag-and-drop or file picker
2. **Generate SHA-256 Hash**: System calculates keccak256 hash locally (off-chain)
3. **Sign with Wallet**: User approves signature request for message containing the hash
4. **Store on Blockchain**: System submits transaction to store document metadata
5. **Verify Document**: User can upload any document to verify if it exists on-chain
6. **Explore History**: User can browse all documents stored in the registry

---

## Project Structure

```
01-document-sign-storage-doing/
│
├── contract/                    # Smart contract codebase
│   ├── src/
│   │   └── DocumentRegistry.sol # Main smart contract
│   ├── script/
│   │   └── Deploy.s.sol         # Deployment script
│   ├── test/
│   │   └── DocumentRegistry.t.sol # Contract tests
│   ├── lib/
│   │   └── forge-std/           # Foundry standard library
│   ├── broadcast/               # Deployment artifacts
│   ├── cache/                   # Build cache
│   ├── foundry.toml             # Foundry configuration
│   └── README.md                # Foundry documentation
│
├── dapp/                        # Frontend application
│   ├── app/
│   │   ├── page.tsx             # Home/wallet selection page
│   │   ├── layout.tsx           # Root layout
│   │   ├── providers.tsx        # Web3 providers
│   │   ├── upload/
│   │   │   └── page.tsx         # Upload & sign page
│   │   ├── verify/
│   │   │   └── page.tsx         # Document verification page
│   │   └── history/
│   │       └── page.tsx         # Document history page
│   ├── components/
│   │   ├── features/            # Feature-specific components
│   │   ├── layout/              # Layout components (Header, Sidebar)
│   │   └── ui/                  # Reusable UI components
│   ├── contexts/
│   │   └── Web3Context.tsx      # Web3 state provider
│   ├── contracts/
│   │   └── DocumentRegistry.json # Contract ABI
│   ├── hooks/
│   │   ├── useContract.ts       # Contract access hook
│   │   └── useWeb3.ts           # Web3 connection hook
│   ├── services/
│   │   └── web3/
│   │       ├── config.ts        # Network configuration
│   │       └── errors.ts        # Error handling
│   ├── utils/
│   │   ├── cn.ts                # Class name utility
│   │   └── formatting.ts        # Data formatting
│   ├── types/
│   │   └── index.d.ts           # TypeScript type definitions
│   ├── public/                  # Static assets
│   ├── styles/                  # Global styles
│   ├── package.json             # Dependencies
│   ├── tailwind.config.js       # Tailwind configuration
│   └── tsconfig.json            # TypeScript configuration
│
├── governance/                  # Project documentation & specifications
│   ├── spec.md                  # Functional specification (22 RFs)
│   ├── spec-acceptance.md       # Acceptance criteria (ACs)
│   ├── spec-nfr.md              # Non-functional requirements
│   ├── constitucion.md          # Project constitution (immutable rules)
│   ├── feedback.md              # User feedback log
│   └── traceability-matrix.md   # Requirements traceability
│
├── .agent/                      # AI agent configuration
│   └── [agent configuration files]
│
└── .kilocodemodes               # Custom mode definitions
```

### Folder Descriptions

| Folder | Purpose |
|--------|---------|
| `contract/` | Solidity smart contracts, tests, and deployment scripts using Foundry |
| `dapp/` | Next.js frontend application with Web3 integration |
| `governance/` | Project specifications, acceptance criteria, and governance documents |
| `.agent/` | AI assistant configuration and instructions |

---

## Smart Contract Overview

### Contract Name: `DocumentRegistry`

**File:** [`contract/src/DocumentRegistry.sol`](contract/src/DocumentRegistry.sol:16)

The `DocumentRegistry` contract is the core of the system, responsible for storing and managing document records on the blockchain.

### Data Structure

```solidity
struct Document {
    bytes32 hash;          // keccak256 hash of the document
    uint256 timestamp;     // Unix timestamp of signing
    address signer;        // Address that signed the document
    bytes signature;       // Cryptographic signature
    string fileName;       // Original filename
    string fileCategory;   // Document category
}
```

### Key Functions

| Function | Purpose |
|----------|---------|
| [`storeDocumentHash()`](contract/src/DocumentRegistry.sol:83) | Store a new document record on-chain |
| [`verifyDocument()`](contract/src/DocumentRegistry.sol:121) | Verify a document signature (simplified) |
| [`getDocumentInfo()`](contract/src/DocumentRegistry.sol:154) | Retrieve complete document information |
| [`isDocumentStored()`](contract/src/DocumentRegistry.sol:163) | Check if a document hash exists |
| [`getDocumentCount()`](contract/src/DocumentRegistry.sol:172) | Get total number of registered documents |
| [`getDocumentHashByIndex()`](contract/src/DocumentRegistry.sol:179) | Enumerate stored document hashes |

### Events

```solidity
event DocumentStored(
    bytes32 indexed hash,
    address indexed signer,
    uint256 timestamp,
    bytes signature,
    string fileName,
    string fileCategory
);

event DocumentVerified(
    bytes32 indexed hash,
    address indexed signer,
    bool isValid
);
```

### Security Features

- **Duplicate Prevention**: Modifier `documentNotExists` prevents storing duplicate hashes
- **Existence Validation**: Modifier `documentExists` ensures operations only on registered documents
- **No On-Chain File Storage**: Only hashes are stored, reducing gas costs
- **Explicit Signer Recording**: Clear attribution of document ownership

---

## Frontend Features

### Pages

#### 1. Home / Wallet Selection ([`/`](dapp/app/page.tsx:28))
- Auto-detects Anvil local blockchain
- Lists all available test accounts
- Displays account balances
- One-click wallet selection

#### 2. Upload & Sign ([`/upload`](dapp/app/upload/page.tsx:42))
- Drag-and-drop file upload
- Real-time hash calculation
- Signature request with clear message
- Transaction submission with confirmation
- Document categorization selector

#### 3. Verify Document ([`/verify`](dapp/app/verify/page.tsx))
- Upload document for verification
- Hash recalculation
- On-chain data retrieval
- Signature validation
- Clear valid/invalid result display

#### 4. Document History ([`/history`](dapp/app/history/page.tsx))
- List all stored documents
- Display metadata (hash, signer, timestamp, category)
- Pagination support
- Copy-to-clipboard functionality

### UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Header` | [`components/layout/Header.tsx`](dapp/components/layout/Header.tsx) | Application header with branding |
| `Sidebar` | [`components/layout/Sidebar.tsx`](dapp/components/layout/Sidebar.tsx) | Navigation sidebar |
| `Topbar` | [`components/layout/Topbar.tsx`](dapp/components/layout/Topbar.tsx) | User context and network status |
| `DocumentSigner` | [`components/features/upload/DocumentSigner.tsx`](dapp/components/features/upload/DocumentSigner.tsx) | Signature workflow component |
| `FileUploader` | [`components/features/upload/FileUploader.tsx`](dapp/components/features/upload/FileUploader.tsx) | File upload component |
| `DocumentVerifier` | [`components/features/verify/DocumentVerifier.tsx`](dapp/components/features/verify/DocumentVerifier.tsx) | Verification workflow component |
| `DocumentHistory` | [`components/features/history/DocumentHistory.tsx`](dapp/components/features/history/DocumentHistory.tsx) | History list component |

### Web3 Integration

- **Context Provider**: [`Web3Context.tsx`](dapp/contexts/Web3Context.tsx:1) manages connection state
- **Custom Hooks**: [`useWeb3`](dapp/hooks/useWeb3.ts:1), [`useContract`](dapp/hooks/useContract.ts:1) for blockchain access
- **Network Configuration**: [`config.ts`](dapp/services/web3/config.ts:1) for RPC endpoints
- **Error Handling**: [`errors.ts`](dapp/services/web3/errors.ts:1) for user-friendly error messages

---

## Governance and Specifications

The `governance/` folder contains critical project documentation that defines the system's behavior and constraints.

### Documents

| File | Description |
|------|-------------|
| [`spec.md`](governance/spec.md:1) | Functional specification with 22 functional requirements (RF-01 to RF-22) |
| [`spec-acceptance.md`](governance/spec-acceptance.md:1) | Acceptance criteria for each functional requirement |
| [`spec-nfr.md`](governance/spec-nfr.md:1) | Non-functional requirements (performance, security, usability) |
| [`constitucion.md`](governance/constitucion.md:1) | Immutable project rules and development principles |
| [`traceability-matrix.md`](governance/traceability-matrix.md:1) | Mapping between requirements and implementation |
| [`feedback.md`](governance/feedback.md:1) | User feedback and improvement suggestions |

### Development Principles

From the [Project Constitution](governance/constitucion.md:11):

1. **Spec-as-Source**: The specification is the single source of truth
2. **No Ambiguity**: Code must implement specification exactly
3. **Testable Logic**: All critical logic must be verifiable via tests
4. **Full Understanding**: No code is accepted without complete understanding
5. **Domain Independence**: Business logic is independent of infrastructure

### Immutable Technical Rules

From the [Project Constitution](governance/constitucion.md:24):

1. No complete files stored on-chain (only hashes)
2. keccak256 is the hashing algorithm
3. ECDSA for digital signatures
4. No redundant data in contracts
5. Private keys only in development (never in production frontend)
6. Explicit and verifiable on-chain interactions

---

## Future Improvements

The following enhancements are potential directions for future development:

### Storage Enhancements
- **IPFS Integration**: Store document metadata or encrypted content on IPFS with hash pinned on-chain
- **Decentralized Storage**: Support for Arweave, Filecoin, or other decentralized storage networks

### Multi-Network Support
- **Testnet Deployment**: Deploy to Sepolia or Holesky testnets
- **Mainnet Deployment**: Production deployment on Ethereum mainnet
- **L2 Support**: Deploy on Optimism, Arbitrum, or Base for lower gas costs
- **Multi-Chain**: Support for Polygon, BSC, or other EVM-compatible chains

### Identity & Access
- **Decentralized Identity (DID)**: Integration with ENS or other DID systems
- **Multi-Signature**: Support for multi-sig document signing
- **Role-Based Access**: Different permission levels for different users

### Audit & Compliance
- **Audit Trail**: Complete history of all document operations
- **Compliance Reports**: Generate compliance documentation for regulatory requirements
- **Third-Party Audit**: Professional smart contract security audit

### User Experience
- **Batch Operations**: Upload and sign multiple documents in one transaction
- **Document Groups**: Organize documents into collections or folders
- **Search & Filter**: Advanced search capabilities for document history
- **Export Functionality**: Export document proofs as PDF or JSON

### Technical Improvements
- **Gas Optimization**: Optimize contract for lower gas costs
- **Upgradeability**: Implement proxy pattern for contract upgrades
- **Indexing**: Use The Graph for efficient document querying
- **Mobile App**: React Native or Flutter mobile application

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Foundry (for smart contract development)
- Anvil (local Ethereum node)

### Installation

```bash
# Clone the repository
cd 01-document-sign-storage-doing

# Install contract dependencies
cd contract
forge install

# Install dapp dependencies
cd ../dapp
npm install
```

### Running Locally

```bash
# Start Anvil local blockchain
anvil --host 0.0.0.0 --port 8546

# Deploy contract (in new terminal)
cd contract
forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8546 --broadcast

# Start development server (in new terminal)
cd dapp
npm run dev
```

### Running Tests

```bash
# Contract tests
cd contract
forge test

# Frontend tests
cd dapp
npm test
```

---

## License

This project is licensed under the MIT License.

---

## Author

Created and maintained by **René Orellana**.

---

## Contact

If you have questions, suggestions, or would like to collaborate, you can contact:

**René Orellana**  
Email: t4mmg120@hotmail.com