# Invariant Map

> SwapEscrow | 10 guards | 9 inferred | 4 not enforced on-chain

---

## 1. Enforced Guards (Reference)

Per-call preconditions. Heading IDs below (`G-N`) are anchor targets from x-ray.md attack surfaces.

NatSpec-stated global invariants do NOT belong here — they route directly to §2/§3/§4 by shape.

#### G-1
`require(tokenA != tokenB, "Tokens must differ")` · `Escrow.sol:70` · Prevents self-swap; ensures two distinct ERC-20 tokens participate in every operation

#### G-2
`require(amountA > 0 && amountB > 0, "Amounts > 0")` · `Escrow.sol:71` · Prevents zero-value operation creation; ensures both sides of the swap carry economic weight

#### G-3
`require(allowedTokens[tokenA] && allowedTokens[tokenB], "Token not allowed")` · `Escrow.sol:72` · Enforces token allowlist at operation creation; both sides must be owner-approved before use

#### G-4
`require(deadline > block.timestamp, "Deadline in past")` · `Escrow.sol:73` · Ensures every new operation starts with a future expiry; prevents creation of already-expired operations

#### G-5
`require(IERC20(tokenA).balanceOf(address(this)) - balBefore == amountA, "Fee-on-transfer not allowed")` · `Escrow.sol:77` · Enforces ADR-002: verifies exact tokenA receipt; reverts if the token deducted a fee in transit (fee-on-transfer detection)

#### G-6
`require(op.state == State.Active, "Not active")` · `Escrow.sol:99` · Guards `completeOperation` against already-settled operations; enforces unidirectional state machine (I-1)

#### G-7
`require(msg.sender != op.creator, "Is creator")` · `Escrow.sol:100` · Enforces I3/I4: creator cannot complete their own operation; prevents trivial self-dealing or fund extraction without counterparty

#### G-8
`require(block.timestamp <= op.deadline, "Operation expired")` · `Escrow.sol:101` · Enforces I12/I-6: expired operations cannot be completed; executor must act within the creator-agreed window

#### G-9
`require(op.state == State.Active, "Not active")` · `Escrow.sol:116` · Guards `cancelOperation` against already-settled operations; same state gate as G-6 but at a different callsite

#### G-10
`require(msg.sender == op.creator, "Not creator")` · `Escrow.sol:117` · Enforces I3: only the original creator may cancel their own operation; prevents third-party forced cancellation

---

## 2. Inferred Invariants (Single-Contract)

#### I-1

`StateMachine` · On-chain: **Yes**

> An operation's state transitions unidirectionally: `Active → Completed` or `Active → Cancelled`. No code path returns any state to `Active`.

**Derivation** — edge: `State.Active@L79 → State.Completed@L103` (guarded by `require(state==Active)@L99`); `State.Active@L79 → State.Cancelled@L119` (guarded by `require(state==Active)@L116`). Write-site enumeration of `op.state`: L79 (initial set to Active in `createOperation`), L103 (→ Completed in `completeOperation`), L119 (→ Cancelled in `cancelOperation`). No write site restores Active from either terminal state.

**If violated** — double-completion or double-cancellation; tokenA could be drained twice from the escrow

---

#### I-2

`Bound` · On-chain: **Yes**

> `allowedTokens[token]` can only transition `false → true`; tokens cannot be delisted once added.

**Derivation** — guard-lift: `allowedTokens[token] = true` at `Escrow.sol:52` is the only write site of the `allowedTokens` mapping in the entire codebase. No `removeToken` or any other write site exists. The mapping is permanently monotone-increasing — a once-listed token remains listed forever.

**If violated** — post-listing behavior changes (fees, blacklist, pause) in a listed token cannot be remediated by the Owner; Active operations using the affected token become permanently uncancellable (see X-2)

---

#### I-3

`Temporal` · On-chain: **Yes**

> An operation's `deadline` is immutable after creation; no function can extend or shorten it.

**Derivation** — temporal: `op.deadline = deadline@Escrow.sol:91` is the sole write site of `op.deadline`. `completeOperation`, `cancelOperation`, `addToken`, `pause`, `unpause` contain no write to any `op.deadline` field (verified by reading L97-143).

**If violated** — deadline manipulation after creation; creators or executors could not rely on the agreed expiry terms

---

#### I-4

`Conservation` · On-chain: **No**

> The contract's actual balance of any token equals the sum of `amountA` across all Active operations for that token.

**Derivation** — Δ-pair: `createOperation` deposits `amountA` of tokenA (external balance increases) and records `op.amountA` in storage, but no paired scalar `heldBalance[tokenA]` is incremented. `cancelOperation` and `completeOperation` transfer out `op.amountA` without decrementing any aggregate balance variable. The conservation law is implied by CEI + state machine (I-1) but is NOT stored in a dedicated balance variable. Direct token donation via `token.transfer(escrow, X)` (not through any Escrow function) inflates actual token balance with no corresponding storage update and no recovery path.

**If violated** — excess tokens beyond the escrowed sum accumulate with no on-chain recovery mechanism; a deficit (not possible under normal operation) would cause `cancelOperation` or `completeOperation` to revert for insufficient balance

---

#### I-5

`StateMachine` · On-chain: **Yes**

> `op.executor` is set exactly once per operation, from `address(0)` to the completing executor's address, only during the `Active → Completed` transition.

**Derivation** — edge: `op.executor = address(0)@L84` (initial creation) → `op.executor = msg.sender@L105` (in `completeOperation` only, after `require(state==Active)@L99`). No other write site for `op.executor` exists in scope (verified by reading all functions).

**If violated** — executor record is incorrect; attribution of who completed the swap is compromised

---

#### I-6

`Temporal` · On-chain: **Yes**

> For any Active operation where `block.timestamp > op.deadline`, `completeOperation` reverts; `cancelOperation` remains available.

**Derivation** — temporal: `require(block.timestamp <= op.deadline)@Escrow.sol:101` in `completeOperation`; `cancelOperation` contains no deadline check (confirmed: L114-126 has no `op.deadline` read or comparison). These two functions are the only state-closing paths; test `test_cancelOperation_succeedsAfterDeadline` confirms the intended behavior.

**If violated** — expired operations could be completed; executors could fulfill swaps after the agreed window, overriding the creator's right to cancel

---

## 3. Inferred Invariants (Cross-Contract)

#### X-1

On-chain: **No**

> `completeOperation` assumes `IERC20(op.tokenB).safeTransferFrom(executor, creator, amountB)` delivers exactly `amountB` to `creator`.

**Caller side** — `Escrow.sol:108` — no `balBefore`/`balAfter` delta check wraps this transfer; unlike the identical tokenA entry check at `L75-77` (G-5), the result is not verified

**Callee side** — any ERC-20 registered in `allowedTokens` — the token's `transferFrom` implementation is external and can silently deduct a fee; post-listing fee activation or proxy upgrade can change delivery amount without Escrow's knowledge

**If violated** — creator receives less than `amountB`; executor pays full `amountB` (from allowance) and receives full `amountA`; creator bears the fee loss silently with no on-chain recourse and no revert signal

---

#### X-2

On-chain: **No**

> `addToken` assumes a registered token's core behavior (no pause, no address blacklist, no fee-on-transfer) remains stable for the lifetime of any Active operation using it.

**Caller side** — `Escrow.sol:52` — `allowedTokens[token] = true`; I-2 confirms no delisting path exists after this point

**Callee side** — external token contract — the token owner or governance can enable transfer fees, pause all transfers, or blacklist the Escrow address after registration; `safeTransfer` in `cancelOperation:123` and `completeOperation:109` would revert for a paused or blacklisted token

**If violated** — Active operations using the affected token become permanently stuck; `cancelOperation` reverts on `safeTransfer`, permanently locking creator's `amountA` in the Escrow contract with no recovery mechanism

---

## 4. Economic Invariants

#### E-1

On-chain: **No**

> The Escrow contract holds exactly the tokenA needed to honor all Active operations — no surplus, no deficit.

**Follows from** — `I-1` (unidirectional state transitions ensure each `amountA` is released at most once, in `completeOperation` or `cancelOperation`) + `I-4` (On-chain=No — no internal balance variable exists; direct token donation inflates actual balance above the escrowed sum)

**If violated** — accumulated surplus from direct token donations is permanently unclaimable (no sweep function exists); a deficit, while not achievable under normal operation, would cause settlement functions to revert for insufficient balance
