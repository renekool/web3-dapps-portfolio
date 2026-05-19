# Meta-Transactions Specification (EIP-2771 & EIP-712)

## Overview
Esta especificación describe cómo el contrato `DAOVoting` se integra con un forwarder de confianza para permitir transacciones gasless.

## Requirements

### Requirement: Trusted Forwarder Integration
El contrato `DAOVoting` DEBE reconocer una dirección específica de `MinimalForwarder` y confiar en ella para proporcionar la dirección real del emisor cuando se envía a través de calldata codificado.

#### Scenario: Execution via Forwarder
- **GIVEN** un contrato `DAOVoting` desplegado con una dirección de `trustedForwarder` inicializada.
- **AND** un contrato `MinimalForwarder`.
- **WHEN** el `MinimalForwarder` llama a una función en `DAOVoting` (ej. `vote`).
- **THEN** el contrato `DAOVoting` DEBE identificar al firmante original como el equivalente a `msg.sender` utilizando el ayudante `_msgSender()`.

### Requirement: Native Caller Protection
Los usuarios DEBEN seguir siendo capaces de llamar al contrato directamente (pagando gas) sin romper la lógica.

#### Scenario: Native Execution
- **WHEN** un usuario llama a `deposit()` o `createProposal()` directamente.
- **THEN** `_msgSender()` DEBE devolver el tradicional `msg.sender`.

### Requirement: Signature Integrity (EIP-712)
El `MinimalForwarder` DEBE verificar que la firma proporcionada por el usuario coincide con la solicitud y no ha sido reutilizada (replayed).

#### Scenario: Replay Attack Prevention
- **WHEN** un relayer intenta reenviar una meta-transacción que ya fue exitosa.
- **THEN** el `MinimalForwarder` DEBE revertir porque el `nonce` ya ha sido consumido.
