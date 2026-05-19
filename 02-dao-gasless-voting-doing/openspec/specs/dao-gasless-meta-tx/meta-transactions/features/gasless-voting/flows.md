# Interaction Flows: Gasless Sequencing

## 1. Gasless Flow (Optimistic Mode)
1. **User Action**: Click "Vote / Create" with "Use Gasless" enabled.
2. **Pre-check**: Frontend calls `GET /api/relay/status`. If funds < 0.05 ETH, force Manual Mode.
3. **Context Fetch**: Frontend calls `forwarder.getNonce(userAddress)`.
4. **Struct Build**: Construct `ForwardRequest` JSON object:
   - `from`: user wallet
   - `to`: DAO address
   - `value`: 0
   - `gas`: 500k-1M
   - `nonce`: from contract
   - `data`: encoded contract function call
4. **Sign Off-chain**: User signs via `eth_signTypedData_v4`.
5. **Relay Send**: `POST /api/relay { request, signature }`.
6. **Backend Check**: Recover address from EIP-712 and verify `to` address.
7. **Relay Exec**: Backend Wallet calls `Forwarder.execute(request, signature)`.
8. **Confirmation**: Frontend waits for the result of the relay call.

## 2. Normal Flow (Standard Mode)
1. **User Action**: Click "Vote / Create" with "Use Gasless" disabled.
2. **Contract Call**: `writeContract` via Wagmi directly to DAO address.
3. **Metamask Confirmation**: User pays gas manually.
4. **Network Execution**: Transaction is mined and updated in the grid.

## 3. Fallback Flow (Relay Failure)
1. **Error Trigger**: Relayer responds with error (4xx/5xx).
2. **UI Feedback**: Show notification: "Gasless relay failed. Switch to manual?".
3. **Execution**: User re-submits in Normal Mode if desired.
