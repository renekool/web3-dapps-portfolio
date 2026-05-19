## 1. Infraestructura de Foundry

- [ ] 1.1 Ejecutar `forge init --force` dentro de la carpeta `contracts/` si no existe un entorno base (con `src/` y `test/`).
- [ ] 1.2 Limpiar cualquier archivo base existente como `contracts/src/Counter.sol`.

## 2. Contrato Principal: Tesorería y Dependencias Core

- [ ] 2.1 Crear el contrato `contracts/src/DAOVoting.sol` e importar `ReentrancyGuard` de OpenZeppelin.
- [ ] 2.2 Definir los estados del contrato: un mapping de depósitos (`mapping(address => uint256) public deposits`) y la variable escalar `totalDeposited`.
- [ ] 2.3 Implementar la función `deposit() public payable` que suma los aportes al `deposits` individual y engrosa matemáticamente al `totalDeposited`.

## 3. Contrato Principal: Lógica de Propuestas y Votación

- [ ] 3.1 Definir la jerarquía de estado `enum ProposalState { Pending, Active, Executed, Failed }`. Reemplazar el viejo booleano por una función o variable de estado riguroso para la estructura `Proposal` (proposer, recipient, amount, totalDepositedAtCreation, deadline, timelockDeadline, forVotes, againstVotes, state o executed).
- [ ] 3.2 Definir `enum VoteType { Abstain, For, Against }` y estructura `VoteReceipt { VoteType vote; uint256 weightVoted; bool hasVoted; }` para un `mapping...`.
- [ ] 3.3 Programar `createProposal`. Validar 1% piso, validez de `reqAmount > 0`, límite `reqAmount <= address(this).balance * 25 / 100`, instanciar la variable `totalDepositedAtCreation`, y forzar una duración mínima para el `deadline` garantizando tiempo de debate.
- [ ] 3.4 Programar `vote()`. Validar que el estado actual sea estrictamente `Active` (antes del `deadline`). Implementar protección completa contra el **doble voto redundante**, revirtiendo si el usuario vota con el mismo `VoteType` previo sin cambios. Ajustar saldos de votos extrayendo el `weightVoted` si ya tenía un recibo, y reemplazarlo con el depósito actual.

## 4. Contrato Principal: Ejecución Automática (Timelock/Quorum)

- [ ] 4.1 Programar `executeProposal(uint256 proposalId)` usando `nonReentrant`. Implementar **protección contra ejecución doble** asegurando estrictamente que el estado sea `Active` o `Pending` (no puede ser ni `Executed` ni `Failed`), validando además la superación de `deadline` + `timelock`.
- [ ] 4.2 Validar regla matemática: Quórum frente al `30%` del snapshot. Validar mayoría (`>60%`) para aprobar. Si falla cualquiera de las dos, cambiar el estado de la propuesta a `Failed` y emitir evento sin revertir abusivamente para sellar la contabilidad.
- [ ] 4.3 Si es exitosa, cambiar el estado a `Executed`.
- [ ] 4.4 Ejecutar transferencia de `amount` al `target` (deduciéndolo del `totalDeposited`).

## 5. Pruebas Aisladas (Spec-driven Tests de Fundación)

- [ ] 5.1 Escribir `contracts/test/DAOVoting.t.sol` programando mocks con depósito y denegaciones `deposit()`.
- [ ] 5.2 Testear de manera exitosa y también fallida (debajo del 1%) al crear `createProposal()`.
- [ ] 5.3 Elaborar tests de alteración dinámica e inteligente para la sobreescritura del `vote()`.
- [ ] 5.4 Comprobar mediante saltos en el bloque de Foundry (`vm.warp`) la negación, la reversión y el suceso final de `executeProposal()`.
