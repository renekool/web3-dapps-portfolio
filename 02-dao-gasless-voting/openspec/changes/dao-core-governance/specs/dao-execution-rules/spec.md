## ADDED Requirements

### Requirement: Validaciones Obligatorias Previas a Liquidación (Seguridad de Pagos)
Las ejecuciones (llamadas `executeProposal`) operan con una aserción final severa. Tres puertas de guarda controlan el `transfer()` de salida: Expiración Cronológica Positiva (Superar Timestamp y Timelocks de gracia), Quórum > 30% e Índice Favorable > 60%.

#### Scenario: Interrupción del Pagador (Execution Temprana)
- **WHEN** se gatilla artificialmente un cierre de proceso sin permitir la superación formal del periodo `deadline` + `timelock`.
- **THEN** las salvaguardas evitan fugas o confirmaciones maliciosas revirtiendo de primer impacto.

#### Scenario: Ratio Insuficiente a Pesar de Participación Masiva o Falta de Quórum
- **WHEN** el cierre ocurre pero un recuento final de opiniones positivas es insuficiente (ej. 55%) o no se logra exceder el requisito formal del quórum total del 30% del snapshot original.
- **THEN** el motor evalúa negativa la petición, cambiando permanentemente el estado de la propuesta a `Failed` (en lugar de revertir abusivamente o consumir gas innecesario, se sella la contabilidad) y descartando el pago.

#### Scenario: Quórum basado en Snapshot Inmutable (Prevención de Dilución o Inflación)
- **WHEN** el `totalDeposited` de la DAO se dispara por un gran depósito (o baja si fondos existieran de extracciones) DESPUÉS de creada la propuesta.
- **THEN** la ejecución no penalizará a los votantes con un 30% nuevo imposible de alcanzar, evaluando el Quórum **estrictamente sobre el snapshot** `totalDepositedAtCreation`.

#### Scenario: Efecto de Checks-Effects-Interactions Reentrancy Guardian
- **WHEN** todo parámetro (fecha y mayorías) es óptimo y se envía el pago a un contrato hostil o fallback.
- **THEN** el estado de la propuesta cambia formalmente a `Executed` de forma previa a la transferencia de fondos protegida por un modifier como `ReentrancyGuard`, y se deduce el monto del `totalDeposited` global previniendo dobles envíos y descalce financiero.

#### Scenario: Protección contra Ejecución Doble (Double-Spend)
- **WHEN** un llamado intenta re-ejecutar una propuesta cuyo estado ya mutó a `Executed` o `Failed`.
- **THEN** la operación es inmediatamente rechazada en la primera línea de ejecución ("Proposal not Active/Pending") impidiendo el drenaje recurrente de la tesorería.
