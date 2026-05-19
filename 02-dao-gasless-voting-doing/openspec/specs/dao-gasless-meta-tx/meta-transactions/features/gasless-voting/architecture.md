# Layered Architecture: Gasless Infrastructure

## 1. Frontend Layer (React + Wagmi + Viem)
**Responsabilidades**:
- **Interface**: Proveer toggle `Use Gasless` en modales de interaccion.
- **Nonce Fetching**: Llamar al contrato `MinimalForwarder` para obtener el nonce actual del usuario.
- **Signature Engine**: Construir el struct `ForwardRequest` y generar la firma **EIP-712**.
- **Relay Dispatcher**: Enviar la combinacion `{ request, signature }` al Relayer API.
- **State Tracking**: Gestionar estados de UX: `Signing`, `Relaying`, `Confirming`, `Success/Error`.

## 2. Relayer Layer (Next.js API Route)
**Responsabilidades**:
- **Endpoint**: `/api/relay`.
- **Availability Check**: `/api/relay/status` (GET) para verificar fondos y estado.
- **Validation**:
  - Verificar firma contra el remitente (`from`).
  - Filtrar destino (`to`) solo contra el contrato `DAOVoting`.
  - Limitar `gasLimit` solicitado.
- **Transaction Sending**: Firmar on-chain usando una wallet financiada (`RELAYER_PRIVATE_KEY`) y llamar a `Forwarder.execute()`.
- **Relay Feedback**: Devolver hash de la transaccion o error estructurado.

## 3. Smart Contracts Layer (Solidity + Foundry)
**Responsabilidades**:
- **MinimalForwarder**:
  - Validar firma **EIP-712**.
  - Gestionar nonces incrementales.
  - Anexar `from` al calldata del destinatario.
- **DAOVoting**:
  - Heredar de `ERC2771Context`.
  - Usar `_msgSender()` en lugar de `msg.sender` en todas las funciones de estado.

## 4. Tech Stack Metrics
- **Auth**: EIP-712 Typed Data Signing.
- **Meta-TX Standard**: EIP-2771.
- **Provider**: Anvil (LocalDev) / Next.js API.
