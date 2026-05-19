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

### Requirement: Gasless Preference Persistence
El estado del `GaslessToggle` (ON/OFF) DEBE persistir entre recargas de página (F5) mediante almacenamiento local. La preferencia del usuario DEBE ser independiente de si la billetera está conectada o si el relayer está actualmente disponible.

### Requirement: Hybrid Logic Separation
El sistema DEBE diferenciar entre:
- **Preferencia del Usuario**: Deseo explícito de usar Gasless (persistente).
- **Disponibilidad del Relayer**: Estado dinámico de la infraestructura (disponible/checking/unavailable).
- **Estado Efectivo**: Resultante de (Preferencia && Disponibilidad).

### Requirement: UI Stability
El control de Gasless DEBE ser visible y estable durante todas las fases de carga ("Checking..."), permitiendo al usuario cambiar su preferencia incluso antes de que la sesión de la billetera se restablezca.

### Requirement: Session Integrity
La dApp DEBE reflejar el estado real de la billetera sincronizadamente. Si la billetera está bloqueada o no hay una sesión activa confirmada por el proveedor (Wagmi/MetaMask), la interfaz NO DEBE mostrar al usuario como "Conectado" ni permitir el acceso a áreas privadas. Cualquier desincronización entre el almacenamiento persistente (localStorage) y el proveedor DEBE resolverse a favor del proveedor inmediatamente.

### Requirement: Signature Integrity (EIP-712)
El `MinimalForwarder` DEBE verificar que la firma proporcionada por el usuario coincide con la solicitud y no ha sido reutilizada (replayed).

#### Scenario: Replay Attack Prevention
- **WHEN** un relayer intenta reenviar una meta-transacción que ya fue exitosa.
- **THEN** el `MinimalForwarder` DEBE revertir porque el `nonce` ya ha sido consumido.

### Requirement: Hybrid Execution Mode (Gasless First)
La dApp DEBE priorizar transacciones gasless por defecto, pero DEBE permitir al usuario alternar a transacciones directas (pagando gas) mediante un control UI explícito (`GaslessToggle`).

### Requirement: Controlled Fallback (Infrastructure Error)
Si el Relayer genera un error de infraestructura (ej. `RELAYER_INSUFFICIENT_FUNDS`, `TIMEOUT`), el sistema DEBE transicionar a un estado `fallback_pending` y solicitar consentimiento al usuario para ejecutar la transacción de forma directa. Errores críticos (ej. `INVALID_SIGNATURE`) NO disparan fallback.

### Requirement: State Machine Consistency
El frontend DEBE seguir una máquina de estados determinística (`idle` → `signing` → `relaying` → `confirming` → `success` | `error` | `fallback_pending`) manejada por el Hook `useGasless`, garantizando una UX trazable y evitando ejecuciones duplicadas.

---
Ver detalles en:
- [Arquitectura de Componentes](architecture.md)
- [Flujos de Usuario y Fallback](flows.md)
- [Máquina de Estados useGasless](state-machine.md)
- [Seguridad y Hardening](security.md)
