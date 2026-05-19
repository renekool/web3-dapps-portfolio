# Requerimientos No Funcionales — ETH Document Registry

## 1. Propósito

Este documento define las restricciones sistémicas del sistema.
Describe cómo debe comportarse el sistema.
No define funcionalidades.

---

## 2. Seguridad (EARS)

### RNF-01 — Protección de Claves Privadas

WHILE operating in production environments  
THE SYSTEM SHALL never access, expose or persist private keys.

WHILE operating in local development with Anvil  
THE SYSTEM MAY use pre-funded test private keys strictly for development purposes.

---

### RNF-02 — Firma Off-Chain

WHILE generating document signatures  
THE SYSTEM SHALL perform signature generation within the connected wallet.

---

### RNF-03 — Separación de Responsabilidades

WHILE verifying document authenticity  
THE SYSTEM SHALL perform cryptographic verification off-chain.

---

### RNF-04 — Inmutabilidad On-Chain

WHEN a document is successfully stored  
THEN the system shall not allow modification of the stored hash.

---

### RNF-05 — Prevención de Red Incorrecta

IF the application detects an unsupported chain ID  
THEN the system shall prevent blockchain interactions.

---

### RNF-06 — Configuración por Entorno

WHILE initializing RPC configuration  
THE SYSTEM SHALL read provider configuration from environment variables.

---

## 3. Comportamiento del Sistema (EARS)

### RNF-07 — Determinismo de Hash

WHEN the same document file is processed multiple times  
THEN the system shall always produce the same hash.

---

### RNF-08 — Consistencia de Estado

WHILE a transaction is pending  
THE SYSTEM SHALL reflect the pending state in the user interface.

---

### RNF-09 — Confirmación de Finalidad

WHEN a transaction is confirmed  
THEN the system shall update the state to confirmed only after receiving network confirmation.

---

### RNF-10 — No Bloqueo de Interfaz

WHILE waiting for blockchain confirmation  
THE SYSTEM SHALL not freeze the user interface.

---

## 4. Mantenibilidad

- The system shall be implemented using strict TypeScript mode.
- No use of `any` without documented justification.
- Business logic shall be unit-tested.
- The smart contract shall include automated tests.
- Code shall follow separation of responsibilities.

---

## 5. Escalabilidad

- The system shall operate in both local and testnet environments.
- Changing RPC provider shall not require domain changes.
- The architecture shall allow future multi-network support.

---

## 6. Observabilidad

- The system shall display transaction hashes.
- The system shall allow independent verification via block explorer.