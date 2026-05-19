# Frontend State Machine: UI Execution States

## 1. Initial State (IDLE)
**UI Display**: Toggle "Use Gasless" enabled, Action button "Propose / Vote".
**Triggers**: User Click.

## 2. Signing State (SIGNING)
**UI Display**: Modal "Awaiting Signature (Off-chain)".
**Action**: User Wallet calls `signTypedData`.
**Transitions**:
- **Success**: `RELAYING`.
- **Cancel**: `IDLE`.
- **Error**: `FAILED`.

## 3. Relaying State (RELAYING)
**UI Display**: Progress bar "Sending to Relayer...".
**Action**: `POST /api/relay`.
**Transitions**:
- **Success (Hash received)**: `CONFIRMING`.
- **Relayer Error (4xx/5xx)**: `FAILED`.

## 4. Confirming State (CONFIRMING)
**UI Display**: Progress bar "Mining on-chain...".
**Action**: `useWaitForTransactionReceipt`.
**Transitions**:
- **Receipt Success**: `SUCCESS`.
- **Reverted**: `FAILED`.

## 5. Termination States (SUCCESS / FAILED)
- **SUCCESS**: Show check icon, update grid, close modal.
- **FAILED**: Show error notification with "Try manually (gas)" or "Retry gasless".

## State Diagram
IDLE → PREPARING → SIGNING → RELAYING → CONFIRMING → SUCCESS | FAILED
   (any) → FAILED
   FAILED → IDLE
