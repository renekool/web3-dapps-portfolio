# Especificación Funcional — ETH Document Registry

## 1. Alcance

Sistema para registrar y verificar la autenticidad de documentos mediante almacenamiento del hash y firma digital en blockchain.

> [!IMPORTANT]
> **Migración Sepolia:** Para detalles específicos sobre la arquitectura, flujos y estados de red durante la migración a Sepolia Testnet, consultar el documento: [spec-migration-sepolia.md](file:///home/rene/web3-dev/doing/01-document-sign-storage-sepolia-doing/governance/spec-migration-sepolia.md).

---

## 2. Requerimientos Funcionales (EARS)

### RF-01 — Generación de Hash

WHEN a user uploads a document  
THEN the system shall calculate the keccak256 hash of the file locally before any blockchain interaction.

---

### RF-02 — Visualización del Hash

WHEN a hash is generated  
THEN the system shall display the computed hash to the user.

---

### RF-03 — Firma del Documento

WHEN a user requests to sign a document hash  
THEN the system shall request a cryptographic signature from the connected wallet.

---

### RF-04 — Confirmación de Firma

WHEN a signature is successfully generated  
THEN the system shall display the generated signature to the user.

---

### RF-05 — Almacenamiento On-Chain

WHEN a user confirms storage  
THEN the system shall submit a transaction to store:
- document hash
- timestamp
- signer address
- signature

---

### RF-06 — Prevención de Duplicados

IF a document hash already exists on-chain  
THEN the system shall reject storage of the duplicate hash.

---

### RF-07 — Confirmación de Transacción

WHEN a transaction is successfully submitted  
THEN the system shall display the transaction hash to the user.

---

### RF-08 — Verificación de Documento

WHEN a user requests verification  
THEN the system shall:
1. Recalculate the document hash.
2. Retrieve stored data from the blockchain.
3. Verify the signature off-chain.
4. Return a verification result.

---

### RF-09 — Documento No Existente

IF the document hash is not found on-chain  
THEN the system shall inform the user that the document is not registered.

---

### RF-10 — Firma Inválida

IF the recalculated signature does not match the stored signer address  
THEN the system shall return an invalid verification result.

---

### RF-11 — Consulta de Historial

WHEN a user requests document history  
THEN the system shall retrieve all stored document hashes and associated metadata.

---

### RF-12 — Cambio de Wallet (EIP-1193)

WHEN a user selects a different wallet or account in the provider  
THEN the system shall capture the `accountsChanged` event.  
THEN the system shall update the active signer and address context immediately without a full page reload but while invalidating active session data.

---

### RF-13 — Separación Off-chain / On-chain

WHILE calculating hash and verifying signature  
THE SYSTEM SHALL perform these operations off-chain.

WHILE storing document data  
THE SYSTEM SHALL perform this operation on-chain via a signed transaction.

---

### RF-14 — Integridad del Documento

IF a document file is modified after storage  
THEN the recalculated hash shall not match the stored hash and verification shall fail.

---

### RF-15 — Rechazo de Firma

IF a user rejects a signature request  
THEN the system shall:
1. Abort the signing process.
2. Display a clear cancellation message.
3. Preserve previously calculated data.

---

### RF-16 — Rechazo de Transacción

IF a user rejects a transaction confirmation  
THEN the system shall:
1. Abort the submission process.
2. Not modify local state.
3. Display a transaction cancellation message.

---

### RF-17 — Error de Red RPC

IF the RPC provider fails to respond  
THEN the system shall:
1. Display a network error message.
2. Not assume transaction success.
3. Allow the user to retry.

---

### RF-18 — Transacción Fallida On-Chain

IF a submitted transaction reverts  
THEN the system shall:
1. Capture the revert reason if available.
2. Display a meaningful error message.
3. Not mark the document as stored.

---

### RF-19 — Chain ID Incorrecto

IF the connected network does not match the target network (Sepolia, Chain ID: 11155111)  
THEN the system shall:
1. Prevent transaction submission and signing.
2. Inform the user of the incorrect network via an UI Guard (Badge/Banner/Alert).
3. Request network switching.
4. If a manual network change occurs (`chainChanged`), the system may trigger a full reload to ensure cross-network state integrity.

---

### RF-20 — Hash Inválido

IF the calculated document hash is malformed or empty  
THEN the system shall prevent signing and storage.

---

### RF-21 — Datos Incompletos

IF required data (hash, signature, signer address) is missing  
THEN the system shall prevent submission and notify the user.

---

### RF-22 — Estado Inconsistente

IF local application state becomes inconsistent during processing  
THEN the system shall reset the process to a safe initial state.
---

## 4. Requerimientos de UI/UX (EARS)

### UI-RF-01 — Consistencia de Layout Horizontal

WHILE the user navigates between Dashboard views (Upload, Verify, History)  
THE SYSTEM SHALL maintain identical horizontal margins and centering using a standardized `DashboardContainer` (max-width: 5xl).

---

### UI-RF-02 — Estrategia de Scroll Horizontal (Canvas Scroll)

WHEN the application content exceeds the viewport width  
THE SYSTEM SHALL trigger a horizontal scroll at the `main` container level (window floor) instead of nesting scrolls within individual components.

---

### UI-RF-03 — Alineación de Bloques de Contenido

WHILE rendering multiple functional blocks in a view (e.g., Controls + Table)  
THE SYSTEM SHALL synchronize their widths using `flex-col items-stretch` or `w-max` to ensure the right edges are perfectly aligned on the same vertical axis.

---

### UI-RF-04 — Espacio de Respiro (Breathing Room)

WHEN horizontal scrolling is active  
THE SYSTEM SHALL ensure a minimum right-side padding (e.g., `pr-10`) so the content never touches the screen edge at the end of the scroll.
