# Criterios de Aceptación — ETH Document Registry

Este documento define criterios verificables para cada requerimiento funcional.
Cada criterio está explícitamente vinculado a su RF correspondiente.

> [!NOTE]
> **Aceptación Sepolia:** Durante la migración a Sepolia, los criterios de aceptación de red y wallet se rigen por las definiciones en [spec-migration-sepolia.md](file:///home/rene/web3-dev/doing/01-document-sign-storage-sepolia-doing/governance/spec-migration-sepolia.md).

---

# RF-01 — Generación de Hash

## AC-01.1 Deterministic Hash Calculation
Given a valid document file  
When the file is processed  
Then the system shall compute a deterministic keccak256 hash.

## AC-01.2 Hash Consistency
Given the same file is uploaded twice  
When the hash is recalculated  
Then the resulting hash shall be identical.

---

# RF-02 — Visualización del Hash

## AC-02.1 Hash Display
Given a hash has been generated  
When calculation completes  
Then the system shall display the hash to the user.

---

# RF-03 — Firma del Documento

## AC-03.1 Signature Request
Given a valid document hash exists  
When the user requests signing  
Then the system shall request a cryptographic signature from the connected wallet.
The message to sign MUST be: `Signing document with hash: [keccak256_hash]`.

---

# RF-04 — Confirmación de Firma

## AC-04.1 Signature Display
Given a signature is successfully generated  
When the wallet returns the signature  
Then the system shall display the signature.

---

# RF-05 — Almacenamiento On-Chain

## AC-05.1 Transaction Submission
Given a valid hash and signature  
When the user confirms storage  
Then the system shall submit a blockchain transaction containing:
- hash
- timestamp
- signer address
- signature.

## AC-05.2 Transaction Integrity
Given the transaction is broadcast  
When it is included in a block  
Then the stored data shall match the submitted data.

---

# RF-06 — Prevención de Duplicados

## AC-06.1 Duplicate Rejection
Given a document hash already exists on-chain  
When storage is attempted again  
Then the system shall reject the operation.

---

# RF-07 — Confirmación de Transacción

## AC-07.1 Transaction Hash Display
Given a transaction is successful  
When a transaction hash is returned  
Then the system shall display it to the user.

---

# RF-08 — Verificación de Documento

## AC-08.1 Recalculate Hash
Given a document is uploaded  
When verification begins  
Then the system shall recalculate the keccak256 hash.

## AC-08.2 Retrieve On-Chain Data
Given the hash exists  
When verification proceeds  
Then the system shall retrieve stored data from blockchain.

## AC-08.3 Signature Validation
Given stored signature and signer address  
When verifyMessage() is executed using the prefix `Signing document with hash: `
Then the system shall confirm cryptographic validity.

## AC-08.4 Return Verification Result
Given verification completes  
When result is determined  
Then the system shall return valid or invalid.

---

# RF-09 — Documento No Existente

## AC-09.1 Not Found Notification
Given a document hash does not exist on-chain  
When verification is attempted  
Then the system shall notify the user that the document is not registered.

---

# RF-10 — Firma Inválida

## AC-10.1 Invalid Signature Result
Given the stored signer does not match verification result  
When verification completes  
Then the system shall return invalid.

---

# RF-11 — Consulta de Historial

## AC-11.1 Retrieve Stored Documents
Given one or more documents exist  
When history is requested  
Then the system shall retrieve stored metadata.

---

# RF-12 — Cambio de Wallet (EIP-1193)

## AC-12.1 Update Active Signer
Given the user selects a different account in the wallet  
When the `accountsChanged` event is captured  
Then the system shall update the context without a full page reload but while invalidating current signature/history state.

---

# RF-13 — Off-chain / On-chain Separation

## AC-13.1 Off-chain Processing
Given hashing or signature verification  
When processing occurs  
Then the operation shall execute locally.

## AC-13.2 On-chain Execution
Given storage action  
When user confirms  
Then the system shall submit a signed transaction.

---

# RF-14 — Integridad del Documento

## AC-14.1 Modified File Detection
Given a stored document  
When file content changes  
Then recalculated hash shall not match stored hash.

---

# RF-15 — Rechazo de Firma

## AC-15.1 Abort Signature
Given signature request  
When user rejects  
Then system shall abort process and notify user.

---

# RF-16 — Rechazo de Transacción

## AC-16.1 Abort Transaction
Given transaction request  
When user rejects  
Then system shall abort and notify.

---

# RF-17 — Error de Red RPC

## AC-17.1 Network Failure Handling
Given RPC failure  
When submission occurs  
Then system shall display error and allow retry.

---

# RF-18 — Transacción Fallida

## AC-18.1 Revert Handling
Given transaction reverts  
When revert reason exists  
Then system shall display meaningful message.

---

# RF-19 — Chain ID Incorrecto (Sepolia)

## AC-19.1 Network Validation
Given unsupported network  
When blockchain interaction attempted  
Then the system shall trigger a `NetworkGuard` block.
When a manual network change occurs (`chainChanged`)
Then the system MUST trigger a full page reload.

---

# RF-20 — Hash Inválido

## AC-20.1 Prevent Invalid Hash
Given an empty or malformed hash (e.g. `bytes32(0)`)
When submission is attempted via `storeDocumentHash`
Then the system shall block the operation and revert with "Hash invalido".

---

# RF-21 — Datos Incompletos

## AC-21.1 Prevent Missing Data
Given required data missing (e.g. empty signature string)
When submission is attempted via `storeDocumentHash`
Then the system shall block the operation and revert with "Firma requerida".

---

# RF-22 — Estado Inconsistente

## AC-22.1 Safe Reset
Given unexpected state error  
When detected  
Then system shall reset to safe state.

---

# RF-23 — Finalización de Transacción (Latencia Real)

## AC-23.1 Real-time Feedback
Given a transaction is submitting  
When the network processes the block  
Then the system shall display "Confirmando..." or similar until the block is finalized.

## AC-23.2 Double-click Prevention
Given a transaction is pending response  
When the user clicks the action button again  
Then the button shall be disabled to prevent multiple submissions.

---

# RF-24 — Gestión de Cuenta e Identidad Inyectada

## AC-24.1 BrowserProvider Source
Given the application is running  
When connection is established  
Then the identity MUST come from `window.ethereum` and not from a local array or secret key.

---

# RF-25 — Reglas de Red (Sepolia)

## AC-25.1 Chain Validation
Given a connection exists  
When the network is NOT `11155111`  
Then all functional CTAs shall be disabled and a warning banner displayed.

---

# RF-26 — Reset y Seguridad de Sesión

## AC-26.1 Local Storage Clearance
Given an active session exists  
When the user disconnects  
Then all session-related memory state shall be cleared before redirection.

---

# RF-27 — Disponibilidad de Wallet (EIP-1193)

## AC-27.1 Wallet Unavailable Detection
Given `window.ethereum` is undefined  
When the application mounts  
Then the system shall display a CTA to install a compatible wallet extension.
Then all blockchain interaction buttons shall be permanently disabled.