# System Stabilization: Learnings, Decisions and Criteria

This document summarizes the technical criteria and architectural decisions that allowed the DAO Gasless application to reach a stable and functional state. It serves as a guide for future development and to avoid recurring issues in Web3 integrations.

---

## 1. Key Corrections & Problem Solving

### State Management Persistence (The "Stale Hash" Bug)
*   **The Problem**: The `DepositModal` would get stuck in a "Confirming..." state when switching between transaction modes (Direct -> Gasless). 
*   **The Cause**: Hooks like `useWriteContract` from Wagmi persist their `data` (txHash) and `status` until explicitly reset. If a direct transaction failed or was replaced by a gasless one, the UI was still "watching" the old hash, which didn't exist in the current blockchain session.
*   **The Correction**: Implementation of an explicit **State Reset Flush** at the start of any new transaction initiation (`handleDeposit`). This ensures that `isSigning`, `txHash`, and `gaslessStatus` start from a clean slate for every attempt.

### Pre-flight Validation (The "1% Threshold" Revert)
*   **The Problem**: Deposits with Rabby/MetaMask would fail silently or get stuck during the signature phase.
*   **The Cause**: The `DAOVoting.sol` contract enforces a rule where any deposit must be >= 1% of the total treasury. Small test deposits (e.g., 0.01 ETH) triggered a `revert` during gas estimation. Many wallets handle estimation reverts by simply not showing the popup or returning an obscure "Internal Error".
*   **The Correction**: Integrated **Proactive Frontend Validation**. The modal now fetches the treasury total and calculates the minimum required amount *before* the user clicks confirm, displaying a warning and disabling the action if the criteria aren't met. Similarly, for **Proposals**, the UI now checks against the **25% Treasury Limit** rule of the contract, preventing reverts before MetaMask even opens.

*   **The Correction**: Standardized the use of explicit RPC URLs from `.env` in the Wagmi configuration and forced account resets in the wallet when the blockchain session restarts.

### React "Hook Order" & Rendering Stability
*   **The Problem**: The dashboard crashed with a "React has detected a change in the order of Hooks" or "Rendered more hooks than during previous render" error.
*   **The Cause**: Conditional returns (e.g., `if (!isMounted) return null;`) placed **before** hook declarations like `useBlock` or `useReadContracts`. This caused a different number of hooks to be registered depending on the hydration status.
*   **The Correction**: Moved the **Hydration Guard** to the end of the component or inside specific `useEffect` blocks. All Hooks must be called unconditionally at the top of the component to maintain React's internal fiber structure.

---

## 2. Technical Decisions & Trade-offs

### Explicit vs. Implicit State Updates
*   **Decision**: Manually calling `reset()` on Wagmi hooks instead of relying on property changes or unmounting.
*   **Rationale**: Ensures immediate UI feedback and prevents race conditions where an old `txHash` is caught by a `useEffect` before the new one is generated.

### Front-running Contract Rules
*   **Decision**: Duplicate critical contract logic (like the 1% threshold) in the frontend.
*   **Rationale**: While duplicating logic carries a maintenance cost, the UX benefit of avoiding "silent reverts" and wasted user effort (signing a transaction that is destined to fail) outweighs the cost in local/test scenarios.

### RPC Configuration
*   **Decision**: Forcing the `transport` to use `process.env.NEXT_PUBLIC_RPC_URL` explicitly instead of the default `http()`.
*   **Rationale**: Avoids "Network Hit" guessing by the library and ensures the browser and relayer are always targeting the same Anvil instance.

---

## 3. UI/UX Patterns for Web3

To ensure a premium and stable feel, the following patterns were consolidated:

1.  **Triple-State Breadcrumbs**: Distinguishing between `Idle` -> `Signing` (Check Wallet) -> `Mining` (Confirming on Chain). Generic "Processing" states are avoided.
2.  **Embedded Overlays**: Using the `GaslessOverlay` as a secondary "contextual layer" inside modals to handle the complex meta-transaction lifecycle without losing the user's focus on the initial action.
3.  **Context Monitoring**: Logging the "Current State" object of the modal on every transition. This allows the agent and developer to "see through the glass" and identify stuck flags without full debugger attachment.

---

## 4. Notable Errors Detected (Anti-Patterns)

*   **Trusting Wagmi Defaults**: Assuming `useWriteContract` will always clear its results. **Action**: Always provide a manual `reset()` path.
*   **Silent Reverts**: Implementing contract calls without checking constraints in the UI first. **Action**: Every `require()` in Solidity should ideally have a corresponding visual check or error message in the React component.
*   **Ignoring Nonce Mismatch**: Assuming the browser wallet is always in sync with a restarted Anvil node. **Action**: Advise "Reset Account" in the README/Skill for any local dev blockchain restart.
*   **Persistent State in Modals**: Failing to clear refs/states from a previous successful transaction when opening the modal for a new one. **Action**: Explicitly call `resetGasless()`, `resetWrite()`, and clear any internal `txHash` refs/states at the start of every transaction flow (`handleCreateProposal`).

---

## 5. Consolidated Best Practices

*   **Synchronous State Hydration**: Reading `localStorage` for user preferences (like Gasless ON/OFF) *before* the first render to prevent "UI flickering" or hydration mismatches.
*   **Refetching on Confirmation**: Triggering `queryClient.invalidateQueries()` immediately after `isConfirmed` is true, ensuring the dashboard reflects the new balance/proposal state without a manual reload.
*   **Explicit ABI Versioning**: Ensuring ABIs are automatically synced via scripts (`deploy-local.sh`) to the frontend after every contract modification.

---

## 6. Final System State

### Flow Lifecycle
1.  **Deposit Initiation**: Component validates amount vs. Treasury 1% rule.
2.  **Mode Detection**: Checks `isGaslessEnabled` (Preference + Relayer Status).
3.  **Signing Phase**: UI shows "Check Wallet"; user signs either a Meta-Tx (Gasless) or a Direct Tx.
4.  **Confirming Phase**: The modal displays the **Hash (TX)** being tracked.
5.  **Synchronization**: `Web3DataSync` watches the chain and updates the global Zustand store once mined.
6.  **Success**: The modal transitions to the Success screen with the updated voting power calculation.

### Wallet Handling
The system maintains a **Strict UI Dependency** on the local store state. Even if Wagmi hasn't fully hydrated, the store provides the "last known" address to prevent layout shifts, while a `Web3DataSync` component acts as the bridge between the Blockchain and the UI state.
