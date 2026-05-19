## ADDED Requirements

### Requirement: Regla Base de Creación (Barrier 1%)
El DAO restringe el permiso de emitir peticiones de gasto a cuentas representativas; para lograrlo, se necesita un piso fundacional de participación equivalente o superior al 1% de la tesorería acumulada total hasta el instante del llamado.

#### Scenario: Propuesta Instanciada por Participante Mayoritario
- **WHEN** un contribuyente supera la franja proporcional requerida `(1%)` y proporciona un beneficiario destino.
- **THEN** un registro contable de su propuesta queda incrustado temporalmente en estado `Active` (o `Pending` que transiciona a `Active` según el timestamp) con fecha de finalización concreta.

#### Scenario: Proponente Deficiente Rebotado
- **WHEN** cualquier nodo contribuyente asoma una propuesta pero carece del balance mínimo exigido frente a la masa del tesoro.
- **THEN** se niega su postulación con resguardo a nivel de contrato.

#### Scenario: Proponente solicita fondos por encima del 25% del total
- **WHEN** un proponente (incluso con fondos superando 1%) intenta pedir el 30% del \`totalDeposited\` o del \`balance\` de la DAO.
- **THEN** la operación revierte inmediatamente en la fase de creación.

#### Scenario: Proponente define una propuesta sin tiempo suficiente para votar
- **WHEN** se intenta empujar un `deadline` tan corto (ej: 1 hora) que no permite debate democrático.
- **THEN** el contrato revierte obligando a que toda propuesta disponga de un mínimo de *X* días de apertura (ej: mínimo 1 día de votación).

#### Scenario: Proponente intenta retirar 0 fondos
- **WHEN** un proponente crea una propuesta con `reqAmount == 0`.
- **THEN** la operación revierte obligando a que el monto solicitado sea estrictamente mayor a 0 para justificar el uso del sistema financiero de la DAO.

### Requirement: Flujo Guiado de Creación (Empty Treasury)
Para mejorar la UX y evitar estados de error confusos, el sistema debe guiar al usuario si la DAO aún no ha sido iniciada financieramente.

#### Scenario: Intento de creación con Tesorería Vacía
- **GIVEN** que `totalDeposited == 0`.
- **WHEN** el usuario hace clic en "New Proposal".
- **THEN** se muestra un modal informativo "Treasury is Empty" explicando que se requiere fondos para operar.
- **AND** se ofrece un botón "Deposit Funds" que redirige internamente al flujo de depósito.

#### Scenario: Transición fluida a Depósito
- **WHEN** el usuario selecciona "Deposit Funds" en el modal de tesorería vacía.
- **THEN** se cierra el modal informativo y se abre automáticamente el `DepositModal`.
