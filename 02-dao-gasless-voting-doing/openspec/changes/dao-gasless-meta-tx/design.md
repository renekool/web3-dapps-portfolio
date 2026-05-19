# Design: dao-gasless-meta-tx

## Goals
- Actualizar `DAOVoting.sol` para que sea compatible con EIP-2771.
- Implementar un mecanismo de forwarding de confianza para desacoplar el pago del gas de la firma de la transacción.
- Mantener la compatibilidad total con las reglas de gobernanza y tesorería existentes.

## Architecture
- **Inheritance**: `DAOVoting` heredará de `ERC2771Context` (OpenZeppelin) y `ReentrancyGuard`.
- **Core logic**: Reemplazar `msg.sender` por `_msgSender()` solo en las funciones dependientes de la identidad (`createProposal`, `vote`).
- **Context Overrides**: Sobrescribir explícitamente `_msgSender()` y `_msgData()` llamando a la implementación de `ERC2771Context` para resolver conflictos de herencia y asegurar la extracción correcta del forwarder.
- **Forwarder**: Usar `MinimalForwarder` (OpenZeppelin) para verificar firmas EIP-712.

## Decisions
- **Standard**: Usamos EIP-2771 porque es el estándar más ampliamente soportado y seguro para meta-transacciones nativas sin requerir una abstracción de cuenta completa (ERC-4337).
- **Trusted Forwarder**: La dirección del forwarder será inmutable y se configurará en el constructor por seguridad.
- **Signature verification**: Delegada al `MinimalForwarder` para mantener `DAOVoting` simple y enfocado en la gobernanza.

## Risks
- **Trusted Forwarder Vulnerability**: Si la dirección del forwarder se ve comprometida o se configura incorrectamente, un atacante podría suplantar cualquier dirección. *Mitigación*: El forwarder es inmutable y se establece al momento del despliegue.
- **Relay Censorship**: Un relayer podría elegir no enviar la transacción de un usuario. *Mitigación*: Los usuarios siempre pueden recurrir al envío directo de transacciones (pagando gas).
