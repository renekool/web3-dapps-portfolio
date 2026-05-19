# Reporte Técnico: Módulo DAO Core Governance

## 1. Resumen del Módulo Implementado
El módulo `dao-core-governance` establece el pilar fundamental del sistema de organización autónoma. Su objetivo ha sido crear y testear exhaustivamente un entorno de gobernanza blindado, centralizado en la custodia de fondos inmutables (Tesorería), la creación responsable de decisiones financieras (Propuestas) y la participación equitativa libre de dobles gastos (Toma de votos y Liquidación). Este primer módulo ha sido programado 100% sobre Foundry y en completo aislamiento de las capas superiores relacionadas a firmas o componentes web.

## 2. Lista de Contratos Solidity Generados
- `contracts/src/DAOVoting.sol`: Smart Contract principal de la DAO que contiene toda la lógica de reglas y ciclo de vida de propuestas.
- `contracts/test/DAOVoting.t.sol`: Archivo de unit testing para Foundry con 9 pruebas rigurosas.

## 3. Arquitectura del Contrato Principal (`DAOVoting.sol`)
El diseño descansa sobre los pilares del estándar de OpenZeppelin integrando de base un `ReentrancyGuard`. La arquitectura agrupa responsabilidades mediante:
- **Gestión de Saldos**: Mapeo inmutable para los balances individuales y un contador total `totalDeposited`. No existe función de retiro simple, forzando un stake con derecho soberano de voto a perpetuidad hasta que sea liberado estrictamente por ejecución comunitaria.
- **Gestión Estructural (Proposals)**: Uso de arreglos enumerados y el State Pattern (tipado fuerte mediante `ProposalState`).
- **Acceso Criptográfico de Estado O(1)**: Un mapeo anidado doble (`mapping(uint256 => mapping(address => VoteReceipt)) public receipts`) permite el descuento sin bucles (Loops) al momento de que un agente altere su decisión democrática.

## 4. Invariantes de Seguridad Implementadas
- **Límite Anti-Spam (El 1%)**: Todo proponente debe custodiar al menos el 1% de la liquidez del tesoro para ejecutar una propuesta.
- **Límite Económico de Gasto**: Toda propuesta está limitada por contrato a solicitar un máximo del 25% del tesoro existente.
- **Sentido Práctico del Depósito y Gasto**: Ningún inversor puede depositar 0 ETH, y ninguna propuesta puede pedir 0 ETH perdiendo gas indiscriminadamente.
- **Periodo Mínimo Democrático Democrático (Timelocks)**: Obligación técnica de sostener tiempos predeterminados (1 día para votación, 1 día para seguridad post-aprobación o timelock) no eludibles.

## 5. El Sistema de Propuestas y Votación
Basado fuertemente en recibos de voto (`VoteReceipt`), el contrato descarta el mero hecho del historial nominal para enfocarse en un **historial ponderado de peso** (Weight).
Cada miembro puede votar a favor o en contra. Si cambia de opinión, es el `weightVoted` previo almacenado en la boleta inmutable lo que el contrato resta a la variable general, y no un balance nuevo. Así, las sumatorias absolutas (`forVotes`, `againstVotes`) siempre concuerdan y mantienen un paralelismo contable perfecto contra los depósitos originales.

## 6. El Uso de Snapshots para Quórum
Una lección primordial del desarrollo fue que medir el quórum sobre un `totalDeposited` dinámico creaba ataques de inflación en el último segundo. Por ende, la arquitectura tomó el uso sistemático de `totalDepositedAtCreation`. Al crear la propuesta, se saca un "snapshot" o foto de la tesorería, congelando por siempre un valor total en la fase de nacimiento. El 30% de Quórum es contra la base inmutable del snapshot, lo que impide manipulaciones externas y evita que una gran billetera arruine propuestas vivas de otros.

## 7. Protecciones contra Actividades Maliciosas
- **Contra el Doble Voto Redundante**: Si un voto carece de cambio frente a su historial en `VoteType`, la transacción se revierte bajo `Already voted that option` evitando consumos insanos, recálculos y ataques DDoS de red contra el contrato.
- **Contra la Ejecución Doble (Double-Spend)**: La función `executeProposal` realiza un assert contundente de la máquina de estados. Al validar inicialmente `p.state == ProposalState.Active` erradica ataques donde se liquidan propuestas en paralelo. Un atacante se encontraría con el muro del estado `Executed` o `Failed` mutado previamente.
- **Contra Ataques de Reentradas (Reentrancy)**: Cumple el standard `CEI` (Checks-Effects-Interactions) de manual: validación, alteración de estado final (`ProposalState.Executed`) y descuento final (`totalDeposited -= amount`), seguido por la llamada `_recipient.call{value: amount}("")`. Se encapsula esta línea en la armadura `nonReentrant` de OpenZeppelin logrando invulnerabilidad probada a reentradas intrínsecas o cruzadas.

## 8. Lista de Tests Generados Automáticamente
- `test_CreateProposal_Success`
- `test_Deposit`
- `test_ExecuteProposal_Failed`
- `test_ExecuteProposal_Success`
- `test_RevertIf_CreateProposal_AmountOver25Percent`
- `test_RevertIf_CreateProposal_NotEnoughFunds`
- `test_RevertIf_DepositZero`
- `test_RevertIf_Vote_SameOption`
- `test_Vote_ChangeVote`

## 9. Guía Básica de Compilación y Ejecución
Para operar el repositorio de Smart Contracts y las dependencias de Foundry:

```bash
# Navegar hacia el directorio root de contratos
cd contracts

# Limpiar cache y dependencias de instalación
forge clean
forge install

# Construir y compilar la base
forge build

# Correr la suite completa de unit testing en consola (con verbosidad 2x)
forge test -vv
```

## 10. Lecciones Clave de Diseño (Implementación)
- No existirá un estado de blockchain o de UI sostenible si la lógica de Smart Contracts no se programa como un ente autosuficiente con verificaciones defensivas.
- Separar la infraestructura criptográfica de gobierno central previene la fragilidad a la hora de inyectar firmas (Meta-Transactions), de manera que el relayer que añadiremos no afecte la solidez demostrada en esta fase.
- La semántica de un error mal estructurado o de tipología no-tipada (booleana sobre enumeradores) provoca problemas de estado en una DAO inmadura capaz de perder la tesorería de un instante al otro. La tipificación dura resolvió este aspecto para siempre en `DAOVoting.sol`.
