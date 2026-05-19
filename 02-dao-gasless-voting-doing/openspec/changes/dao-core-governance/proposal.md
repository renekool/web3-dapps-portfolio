## Why

Este cambio establece las bases fundacionales para un sistema de gobernanza en cadena. La DAO necesita un mecanismo confiable, auditable y seguro para recolectar fondos comunes (Treasury) y tomar decisiones colectivas sobre esos fondos. Separar la lógica esencial de gobernanza de la complejidad de infraestructura (como las meta-transacciones) garantiza que las reglas matemáticas (quórum, mayorías, timelocks) sean blindadas y puedan probarse de forma totalmente independiente.

## What Changes

Implementación central del contrato `DAOVoting.sol` para modelar y custodiar el ciclo de vida completo de la DAO. Específicamente:
- **La Tesorería**: Registro interno de depósitos irrevocables de miembros en base al gas normal de la EVM.
- **Creación de Propuestas**: Gestión del piso de entrada (1% del balance total al momento de proponer) para frenar spam de propuestas triviales.
- **Ciclo de Votación**: Opciones binarias extendidas (Favor, Contra, Abstención) y la contabilidad interna de recuento de votos con derecho a enmendadura (cambio de voto pre-deadline).
- **Ejecución y Seguridad**: Blindaje del gasto frente a condiciones invariantes que deben cumplirse pre-ejecución (Timelock, Quorum de 30%, Aprobación del >60% de votos valiosos y el límite de gasto temporal).

## Capabilities

### New Capabilities
- `dao-treasury`: Recepción y contabilidad del balance de participantes.
- `dao-proposals`: Limitantes y creación de identificadores para gastos hacia un receptor.
- `dao-voting-mechanics`: El motor activo de votación para el derecho participativo de cada miembro.
- `dao-execution-rules`: Bloqueadores de seguridad temporal (Timelocks) y validadores finales antes del envío del capital.

### Modified Capabilities
- Ninguna. Es el punto de partida del núcleo del sistema.

## Impact
- Diseño blindado con patrón CEI (Checks-Effects-Interactions) priorizado sobre la `transferencia`.
- Este diseño fundacional asumirá a `msg.sender` como originario para todas las interacciones, sin requerir conocer infraestructura off-chain (las envolturas de firmas se añadirán en la etapa posterior del Change 2).
