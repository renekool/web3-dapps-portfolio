## Context

Separando la infraestructura de meta-transacciones y el front-end de forma profesional (como se acordó arquitectónicamente), este cambio se centra exclusivamente en construir el corazón de la DAO. Es imperativo desarrollar una lógica infalible para depósitos de usuarios (Tesorería), la toma de decisiones para gastos (Propuestas y Votación), y la seguridad en la liberación de fondos. Se utilizará Solidity para redactar el smart contract `DAOVoting.sol` puro y estándar, testeándolo en completo aislamiento.

## Goals / Non-Goals

**Goals:**
- Implementar la funcionalidad de depósitos de tesorería y registro inmutable de saldos de miembros.
- Programar la lógica matemática restrictiva de propuestas (mínimo de participación del 1% del total depositado).
- Crear las enums para los tipos de Voto (`For`, `Against`, `Abstain`) con la flexibilidad de que el miembro altere su voto antes del cierre.
- Seguir el patrón de diseño `Checks-Effects-Interactions` en la función `executeProposal()` para desembolsos blindados y aplicar las 3 reglas de liquidación (Timelock superado, Quórum > 30%, Mayoría > 60%).

**Non-Goals:**
- Soporte para meta-transacciones (gasless) a través del estándar EIP-2771 o EIP-712. Esto se manejará en el siguiente change.
- Desarrollar un "Daemon" externo o relayer que ejecute las transacciones vencidas.
- Escribir scripts de deployment para redes públicas reales.

## Non-Functional Requirements (NFRs)
- **Seguridad (Reentrancy)**: Es obligatorio heredar y utilizar `ReentrancyGuard` de OpenZeppelin en el método `executeProposal`. El patrón CEI es necesario, pero el guard provee una doble capa indispensable en Web3 interactuando con transferencias de ETH nativo a addresses desconocidos.
- **Eficiencia de Gas (Sin Bucles)**: Queda estrictamente prohibido el uso de loops (`for`, `while`) para contar los votos. El conteo de `forVotes` y `againstVotes` debe ser un sumatorio matemático O(1) actualizado instantáneamente al momento de ejecución de la función `vote()`.

## Decisions

1. **Gestión de Saldos**:
   - `balances[msg.sender]` o `deposits[msg.sender]` se mapeará directamente como cantidad total, en wei.
   - El uso puro de la cuenta `msg.sender` será la regla estricta en todo el flujo local para validar a los miembros originarios dentro de este primer Change.

2. **Cómputos Matemáticos Seguros y Snapshots de Voto**:
   - Los porcentajes (ej. el 1% de fondos o el 30% de quórum) se manejarán utilizando matemáticas estándares de Solidity (`(balance * 1) / 100`).
   - El Quórum **no** evaluará el total del TVL al momento del cierre de la propuesta. Cada propuesta guardará un sub-estado `totalDepositedAtCreation` al momento de instanciarse, para evitar que depósitos enormes de último minuto inflen el requerimiento de quorum imposibilitándolo.
   - Los recibos de voto no solo almacenarán el `VoteType`, sino una copia estática del `uint256 weightVoted`. Esto corrige un *edge case* donde un miembro vota, hace otro depósito y luego altera su voto (restaríamos un balance mayor al que sumó originalmente si no mantenemos un historial de peso unitario para esa boleta).

3. **Arquitectura y Patrones de Seguridad Activa**:
   - Variables de mitigación en cada Proposal individual (`ProposalState state`). Se reemplaza el obsoleto `bool executed` por un `enum { Pending, Active, Executed, Failed }`.
   - Patrón CEI: Se evalúa el estado previo mediante validación, se cambia el estado a `Executed` (o `Failed`), y solo como instrucción de última línea se llamará a `_recipient.transfer(amount)` si fue exitosa.

## 4. Estándares de Desarrollo

1. **TypeScript en modo estricto**: Todas las interfaces deben estar definidas y no se permiten escapes de tipos.
2. **No uso de `any` sin justificación**: Las interacciones con proveedores Web3 (MetaMask) deben usar interfaces tipadas (ej. `MetaMaskProvider`).
3. **Tests obligatorios**: La lógica de propuestas, votos y quórum debe estar cubierta por tests de Foundry.
4. **Seguridad de Credenciales**: Prohibido el uso de claves privadas o mnemónicos reales en el repositorio; usar `.env` y mocks.
5. **Manejo explícito de errores**: Cada interacción con la blockchain debe capturar excepciones y notificar al usuario (Feedback UI).
6. **Validación funcional**: No se transiciona de estado (Zustand/Contrato) sin validación previa de los datos de entrada.

## Risks / Trade-offs

- **Bloqueo Definitivo de Liquidez Total**: Dado que por reglas de negocio no existe un método de `withdraw()`, cualquier ETH enviado al contrato en la primera etapa actuará como un stake destructivo irreversible con fines de gobierno para la DAO, hasta que una propuesta lo liquide hacia otra dirección ganadora.
- **División y Pérdida de Fracciones Numéricas**: Solidity no maneja valores flotantes. El cómputo de los porcentajes de cuotas podría redondear hacia abajo si el balance es extremadamente pequeño y no representativo.
