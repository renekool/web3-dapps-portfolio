# X-Ray Report

> SwapEscrow | 120 nSLOC | bdc1388 (`main`) | Foundry | 14/05/26

---

## 1. Protocol Overview

**What it does:** Custodial bilateral P2P token swap — Creator locks ERC-20 tokenA in the contract; Executor delivers tokenB directly to Creator; contract releases tokenA to Executor atomically.

- **Users**: Creators (deposit tokenA, set swap terms); Executors (fulfill swap, provide tokenB); Owner (manage allowlist, emergency pause)
- **Core flow**: approve tokenA → `createOperation` (locks tokenA) → any Executor `completeOperation` (delivers tokenB, receives tokenA) or Creator `cancelOperation` (recovers tokenA)
- **Key mechanism**: Fixed-rate bilateral escrow; no oracle; no AMM; no slippage; exchange rate immutable after creation
- **Token model**: Any ERC-20 on the owner-managed allowlist; TokenA.sol and TokenB.sol are permissionless-mint test tokens (Anvil only, not in scope for production)
- **Admin model**: Single EOA Owner — controls `addToken`, `pause`, `unpause`; no timelock; no multisig on current deployment

For a visual overview see the [architecture diagram](architecture.svg).

### Contracts in Scope

| Subsystem | Key Contracts | nSLOC | Role |
|-----------|--------------|------:|------|
| Escrow Core | Escrow.sol | 100 | Custodian — holds tokenA, enforces swap lifecycle (create/complete/cancel) |
| Test Tokens | TokenA.sol, TokenB.sol | 20 | Permissionless-mint ERC-20 tokens for local dev only |

### How It Fits Together

The core trick: Creator deposits tokenA into the contract at a fixed rate; any Executor with sufficient tokenB can atomically complete the swap in a single transaction, with tokenB flowing directly to the Creator without ever touching the escrow balance.

### Create Flow

```
Creator → TokenA.approve(escrow, amountA)  [frontend step 1, must mine before step 2]
Creator → Escrow.createOperation(tokenA, tokenB, amountA, amountB, deadline)
  ├─ validates: tokenA≠tokenB, amounts>0, both allowlisted, deadline>block.timestamp
  ├─ balance delta check: balAfter - balBefore == amountA  ← fee-on-transfer guard (L77)
  └─ operations[].push(Operation{state:Active, deadline, amountA, ...})
```

### Complete Flow

```
Executor → TokenB.approve(escrow, amountB)  [frontend step 1, must mine before step 2]
Executor → Escrow.completeOperation(id)
  ├─ checks: state==Active, sender≠creator, block.timestamp≤deadline
  ├─ CEI: op.state=Completed, op.executor=msg.sender, op.closedAt=block.timestamp
  ├─ TokenB.safeTransferFrom(executor → creator, amountB)  ← direct; escrow never holds tokenB
  └─ TokenA.safeTransfer(escrow → executor, amountA)
```

### Cancel Flow

```
Creator → Escrow.cancelOperation(id)
  ├─ checks: state==Active, sender==creator  [no deadline check — creator can cancel after expiry]
  ├─ CEI: op.state=Cancelled, op.closedAt=block.timestamp
  └─ TokenA.safeTransfer(escrow → creator, amountA)
```

---

## 2. Threat & Trust Model

### Protocol Threat Profile

> Protocol classified as: **Custodial P2P Swap** — no standard DeFi category match (no AMM, no oracle, no lending/borrowing)

No price discovery mechanism; settlement risk is eliminated by physical custody of tokenA. Dominant threats come from token behavior anomalies (post-listing changes) and single-key admin control rather than from flash loans or MEV.

### Actors & Adversary Model

| Actor | Trust Level | Capabilities |
|-------|-------------|-------------|
| Owner | Trusted (single EOA, no timelock, no multisig) | `addToken` (instant, any address), `pause`/`unpause` (instant). pause blocks `createOperation` + `completeOperation` but NOT `cancelOperation`. |
| Creator | Bounded (only creates and cancels own operations) | Deposits tokenA, sets all swap terms at creation. `cancelOperation` always available regardless of pause state. |
| Executor | Bounded (completes Active, non-expired, non-owned operations) | Delivers tokenB, receives tokenA. Cannot complete own operations (`require(sender != creator)`). |
| ERC-20 Token | Bounded (must be owner-allowlisted; fee-on-transfer reverts at tokenA entry only) | External contracts; behavior assumed standard but not re-validated after allowlisting. |

See [entry-points.md](entry-points.md) for the full permissionless entry point map.

**Adversary Ranking:**

1. **Compromised Owner** — single EOA controls the token allowlist with no delay; a malicious `addToken` can introduce any contract (including reentrancy hooks or honeypots) as a swap token.
2. **Malicious token operator** — a token listed in good faith can be paused, blacklisted, or upgraded post-listing to add fees, trapping creator funds in Active operations.
3. **Grief/spam attacker** — `createOperation` is permissionless for any allowlisted pair; an attacker can inflate `operations[]` to degrade `getAllOperations()` gas cost with no cleanup mechanism.

### Trust Boundaries

- **Owner → Escrow** — instant, no timelock; `addToken:51` is the blast-radius function — any address becomes a valid swap token. *Git signal: access_control area touched in all 4 source commits.*
- **ERC-20 tokens → Escrow** — post-listing behavior is fully trusted; SafeERC20 wraps transfer failures but does not re-verify token behavior on subsequent calls.
- **Executor → Creator (tokenB direct)** — `safeTransferFrom(executor, creator, amountB)` at `Escrow.sol:108`; escrow assumes exact delivery but no balance-delta check enforces it.

### Key Attack Surfaces

- **tokenB fee-on-transfer not verified in completeOperation** &nbsp;&#91;[X-1](invariants.md#x-1)&#93; — `Escrow.sol:108` transfers tokenB executor→creator with no balance-delta check; unlike the identical guard at `L77` for tokenA entry, there is no `balBefore`/`balAfter` verification; worth checking whether any allowlisted token can conditionally charge fees.

- **No token delisting path** &nbsp;&#91;[X-2](invariants.md#x-2), [I-2](invariants.md#i-2)&#93; — `addToken:52` has no counterpart `removeToken`; a listed token that later enables pause, blacklist, or fees traps all Active ops using it; `cancelOperation` would revert on `safeTransfer:123` for a paused token, locking creator's funds with no recovery.

- **Implicit balance invariant — no internal accounting** &nbsp;&#91;[I-4](invariants.md#i-4), [E-1](invariants.md#e-1)&#93; — no `heldBalance[token]` mapping exists; "escrow balance == Σ Active op amounts" is maintained only by CEI and state transitions; a direct token donation inflates actual balance above escrowed sum with no recovery path.

- **Owner key management** — `addToken`, `pause`, `unpause` execute instantly with no timelock; `Ownable` uses single-step ownership (`constructor(initialOwner):12`); a compromised owner can allowlist a malicious contract as a swap token.

- **operations[] unbounded growth** &nbsp;&#91;[I-1](invariants.md#i-1)&#93; — every `createOperation` appends to `operations[]` with no pruning; `getAllOperations():130` returns the full array; at scale, view calls risk node-side gas limits, and any future on-chain iteration is O(n).

### Protocol-Type Concerns

**As a Custodial P2P Swap:**
- `completeOperation:108` — tokenB goes executor→creator directly; escrow never holds tokenB balance; any ERC-777 `tokensReceived` hook on tokenB fires before `safeTransfer` of tokenA at `L109`; worth confirming whether `nonReentrant` on `completeOperation` is sufficient against ERC-777-style callbacks from tokenB.
- `getAllOperations():130` — returns full unbounded array with no pagination; O(n) gas growth becomes impractical well before Ethereum block gas limits for dense or long-running deployments.

### Temporal Risk Profile

**Deployment & Initialization:**
- `constructor(initialOwner):12` — single-step ownership assignment; no `transferOwnership` + `acceptOwnership` two-step pattern; deployer immediately becomes Owner; if intended owner ≠ deployer, there is a window of deployer-key exposure.
- `TokenA.sol:11`, `TokenB.sol:11` — `mint(address, uint256)` is permissionless; intentional for Anvil, critical severity if deployed to any production environment.

### Composability & Dependency Risks

> **ERC-20 tokens (all allowlisted tokens)** — via `Escrow.createOperation:76-77`, `completeOperation:108-109`, `cancelOperation:123`
> - Assumes: standard transfer semantics; exact amounts delivered; no callbacks that break CEI; no post-listing behavioral changes
> - Validates: SafeERC20 wraps false-return transfers; balance-delta check for tokenA only at `L77`
> - Mutability: external; token owner/governance can change behavior after allowlisting; Escrow has no delisting mechanism
> - On failure: `safeTransfer`/`safeTransferFrom` reverts; operations cannot be settled or cancelled if token is paused/blacklisted

**Token Assumptions** *(unvalidated)*:
- tokenB (in `completeOperation`): assumes exact `amountB` delivered to creator — no balance-delta check; impact: creator receives less than expected silently
- Any listed token: assumes no post-listing behavior changes — no delisting exists; impact: Active operations permanently stuck if token is paused or blacklisted

---

## 3. Invariants

> ### 📋 Full invariant map: **[invariants.md](invariants.md)**
>
> A dedicated reference file contains the complete invariant analysis.
>
> - **10 Enforced Guards** (`G-1` … `G-10`) — per-call preconditions with Check / Location / Purpose
> - **6 Single-Contract Invariants** (`I-1` … `I-6`) — StateMachine, Bound, Conservation, Temporal
> - **2 Cross-Contract Invariants** (`X-1` … `X-2`) — caller/callee pairs crossing scope boundaries
> - **1 Economic Invariant** (`E-1`) — higher-order property deriving from `I-1` + `I-4`
>
> **4 On-chain=No** blocks: I-4, X-1, X-2, E-1. Each is simultaneously an invariant and a potential bug. Attack-surface bullets above cross-link directly into the relevant blocks.

---

## 4. Documentation Quality

| Aspect | Status | Notes |
|--------|--------|-------|
| README | Present | `/README.md` — overview, flow description, test token addresses |
| NatSpec | ~3 annotations | Extremely sparse; no `@invariant` tags; no `@param`/`@return` on any mutating function |
| Spec/Whitepaper | Present (OpenSpec) | `openspec/specs/pb-NN-*/spec.md` — per-PBI specs; `CLAUDE.md` contains invariant list I1–I15 |
| Inline Comments | Sparse | Section header dividers only; no logic-level comments |

**Spec/code divergence noted:** `CLAUDE.md` defines `enum State { Active, Completed, Cancelled, Expired }` (4 states); `Escrow.sol:16` implements only `{ Active, Completed, Cancelled }` (3 states). Expired is handled implicitly via deadline check — no explicit state transition to Expired occurs. Claims tagged `(per spec)` in dependency map above reference OpenSpec pb-11/12/13 content.

---

## 5. Test Analysis

| Metric | Value | Source |
|--------|-------|--------|
| Test files | 6 | File scan |
| Test functions | 31 | File scan |
| Line coverage | 100% (42/42) | `forge coverage` |
| Statement coverage | 100% (36/36) | `forge coverage` |
| Branch coverage | 100% (20/20) | `forge coverage` |
| Function coverage | 100% (8/8) | `forge coverage` |

### Test Depth

| Category | Count | Contracts Covered |
|----------|-------|-------------------|
| Unit | 31 | Escrow.sol, TokenA.sol, TokenB.sol |
| Stateless Fuzz | 0 | — |
| Stateful Fuzz (Foundry) | 0 | — |
| Stateful Fuzz (Echidna) | 0 | — |
| Formal Verification | 0 | — |

### Gaps

- **No fuzz tests** — deadline, amounts, and id parameters in all three lifecycle functions are not fuzz-tested; boundary conditions (deadline = block.timestamp, amounts near uint256 max, id = operations.length) are not exercised.
- **No stateful fuzz / invariant tests** — the implicit conservation invariant (I-4: escrow balance == Σ Active op amounts) is not tested across arbitrary operation sequences; a stateful fuzzer could catch donation-based balance drift.
- **No formal verification** — the CEI ordering and balance-delta check at `L75-77` are not formally verified.

---

## 6. Developer & Git History

> Repo shape: `normal_dev` — 24 commits over 11 days; 4 source-touching commits, all in the final 2 days of the window (2026-05-12–13).

### Contributors

| Author | Commits | Source Lines (+/-) | % of Source Changes |
|--------|--------:|--------------------|--------------------:|
| renekool | 24 | +189 / −0 | 100% |

### Review & Process Signals

| Signal | Value | Assessment |
|--------|-------|------------|
| Unique contributors | 1 | Single developer — no independent review |
| Merge commits | 1 of 24 (4%) | No branch-based peer review evidence |
| Repo age | 2026-05-02 → 2026-05-13 | 11 days |
| Recent source activity (30d) | 4 commits | All source commits in the final 2 days |
| Test co-change rate | 100% | Every source-touching commit also modified test files — consistent practice |

### File Hotspots

| File | Modifications | Note |
|------|-------------:|------|
| sc/src/Escrow.sol | 4 | All security-critical logic — highest review priority |
| sc/src/tokens/TokenA.sol | 3 | Test token — lower risk |
| sc/src/tokens/TokenB.sol | 3 | Test token — lower risk |

### Security-Relevant Commits

| SHA | Date | Subject | Score | Key Signal |
|-----|------|---------|------:|------------|
| f4fc6ac | 2026-05-13 | feat(config): update smart contracts, tests and frontend after local deployment | 14 | adds runtime guards (+7), tightens access control (+5), changes accounting/balance logic |
| 1b0ee5d | 2026-05-12 | chore(config): initialize sc/ Foundry structure | 10 | tightens access control, changes accounting/balance logic, spans 3 security domains |
| 7c149e7 | 2026-05-13 | feat(sc): refine escrow logic and add fee-on-transfer tests | 9 | adds runtime guards (+3), changes accounting/balance logic |

### Dangerous Area Evolution

| Security Area | Commits | Key Files |
|--------------|--------:|-----------|
| access_control | 4 | Escrow.sol |
| fund_flows | 4 | Escrow.sol |
| state_machines | 4 | Escrow.sol |

### Security Observations

- **Single developer** — renekool authored 100% of commits; no independent review in git history.
- **No peer review** — 1 merge commit of 24; no branch-based review process evidence.
- **Late source burst** — all 4 source-touching commits occurred in the final 2 days (2026-05-12–13) of an 11-day window; most recent commit scored 14 (highest in repo).
- **Escrow.sol is top hotspot** — modified in every source commit; access_control + fund_flows + state_machines signals all concentrate in 143 lines.
- **100% test co-change rate** — every source commit included test changes; consistent test discipline.
- **Fee-on-transfer guard added late** — commit 7c149e7 (score 9) introduced the balance-delta check at `L77`; worth verifying the tokenB path at `L108` was intentionally left without an equivalent guard.

### Cross-Reference Synthesis

- **Escrow.sol is #1 in BOTH churn AND attack-surface priority** — all 5 key attack surfaces route through Escrow.sol; highest-leverage review targets: `completeOperation:97-112`, `cancelOperation:114-126`, `addToken:51-55`.
- **fee-on-transfer guard (G-5) added in a high-score late commit** — the asymmetry between L77 (tokenA, checked) and L108 (tokenB, unchecked) may reflect an intentional design choice or an oversight from the same late-burst commit window; the commit message does not clarify.
- **All three dangerous security areas (access_control, fund_flows, state_machines) concentrate in one 143-line file** — any logic error in Escrow.sol has cross-domain blast radius; architectural separation does not exist.

---

## X-Ray Verdict

**FRAGILE** — unit tests achieve 100% coverage but no fuzz, invariant, or formal verification exists; NatSpec is nearly absent (3 annotations); Owner role executes all admin actions instantly with no timelock or multisig.

**Structural facts:**
1. 120 nSLOC across 3 source contracts (100 core escrow + 20 test tokens)
2. 31 unit tests, 100% line/branch/function coverage; 0 stateless fuzz, 0 stateful fuzz, 0 formal verification tests
3. Single developer (renekool, 100% of commits), 0 branch-based peer-review merge commits
4. Owner (single EOA) controls token allowlist and pause with no timelock; 4 of 5 attack surfaces are directly owner-reachable
5. All source development occurred in the final 2 days of an 11-day window; 3 high-score security commits (scores 9, 10, 14) in that window
