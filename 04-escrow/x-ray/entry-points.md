# Entry Point Map

> SwapEscrow | 8 entry points | 2 permissionless | 1 creator-restricted | 3 admin-only | 2 test-token permissionless

---

## Protocol Flow Paths

### Setup (Owner)

`Escrow.addToken(tokenA)` → `Escrow.addToken(tokenB)`  ◄── both tokens must be allowlisted before any operation can be created

### Creator Flow

```
TokenA.approve(escrow, amountA)  ◄── must mine before next step
└─→ Escrow.createOperation(tokenA, tokenB, amountA, amountB, deadline)
      └─→ Escrow.cancelOperation(id)  ◄── caller must be creator; available even when paused
```

### Executor Flow

```
[createOperation above] → [block.timestamp ≤ op.deadline]
└─→ TokenB.approve(escrow, amountB)  ◄── must mine before next step
      └─→ Escrow.completeOperation(id)  ◄── caller must not be creator
```

### Admin Controls

```
Escrow.pause()     → blocks createOperation + completeOperation; cancelOperation unaffected
Escrow.unpause()   → restores normal operation
```

---

## Permissionless

### `Escrow.createOperation()`

| Aspect | Detail |
|--------|--------|
| Visibility | `external`, `nonReentrant`, `whenNotPaused` |
| Caller | Any address (Creator) |
| Parameters | `tokenA` (user-controlled), `tokenB` (user-controlled), `amountA` (user-controlled), `amountB` (user-controlled), `deadline` (user-controlled) |
| Call chain | `→ IERC20(tokenA).balanceOf(escrow)` (snapshot) `→ IERC20(tokenA).safeTransferFrom(creator, escrow, amountA)` `→ IERC20(tokenA).balanceOf(escrow)` (delta check) |
| State modified | `operations[]` (append new Operation), `nextId` (+1) |
| Value flow | Tokens: creator → Escrow (amountA of tokenA) |
| Reentrancy guard | Yes |

### `Escrow.completeOperation(uint256 id)`

| Aspect | Detail |
|--------|--------|
| Visibility | `external`, `nonReentrant`, `whenNotPaused` |
| Caller | Any address except `op.creator` (Executor) — enforced via `require(msg.sender != op.creator)` |
| Parameters | `id` (user-controlled — indexes into `operations[]`) |
| Call chain | `→ IERC20(op.tokenB).safeTransferFrom(executor, creator, amountB)` `→ IERC20(op.tokenA).safeTransfer(executor, amountA)` |
| State modified | `op.state` (→ Completed), `op.executor` (→ msg.sender), `op.closedAt` (→ block.timestamp) |
| Value flow | Tokens: executor → creator (amountB of tokenB, direct — escrow never holds tokenB); Escrow → executor (amountA of tokenA) |
| Reentrancy guard | Yes |

---

## Role-Gated

### Creator-only

#### `Escrow.cancelOperation(uint256 id)`

| Aspect | Detail |
|--------|--------|
| Visibility | `external`, `nonReentrant` (no `whenNotPaused` — intentional per I13) |
| Caller | Creator of the specific operation — enforced via `require(msg.sender == op.creator):117` |
| Parameters | `id` (user-controlled — indexes into `operations[]`) |
| Call chain | `→ IERC20(op.tokenA).safeTransfer(creator, amountA)` |
| State modified | `op.state` (→ Cancelled), `op.closedAt` (→ block.timestamp) |
| Value flow | Tokens: Escrow → creator (amountA of tokenA) |
| Reentrancy guard | Yes |

---

## Admin-Only

| Contract | Function | Parameters | State Modified |
|----------|----------|------------|----------------|
| Escrow | `addToken(address token)` | `token` (admin-chosen, any address) | `allowedTokens[token] = true`, `tokenList.push(token)` |
| Escrow | `pause()` | none | OZ Pausable `_paused = true` |
| Escrow | `unpause()` | none | OZ Pausable `_paused = false` |

---

## Test-Token Entry Points (Anvil only — not in scope for production)

| Contract | Function | Access | Notes |
|----------|----------|--------|-------|
| TokenA | `mint(address to, uint256 amount)` | Permissionless | Intentional for dev; no access control — critical if ever deployed outside Anvil |
| TokenB | `mint(address to, uint256 amount)` | Permissionless | Intentional for dev; no access control — critical if ever deployed outside Anvil |
