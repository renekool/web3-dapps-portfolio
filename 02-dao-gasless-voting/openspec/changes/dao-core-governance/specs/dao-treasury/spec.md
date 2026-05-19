## ADDED Requirements

### Requirement: Registro Inmutable de Contribuciones
Todo integrante puede inyectar valor (ETH) a la Tesorería. Estos depósitos se consolidan permanentemente, incrementando su derecho en el Pool sin contemplar métodos de reversión ni rescate del depósito inicial.

#### Scenario: Depositando Fondos Exitosamente a la DAO
- **WHEN** un miembro invoca el método \`deposit()\` enviando valor EVM nativo (`msg.value > 0`).
- **THEN** su saldo personal depositado se indexa en proporción y el balance general de la tesorería es actualizado.

#### Scenario: Intento de Depósito Vacío
- **WHEN** un miembro trata de añadir liquidez con cantidad `0 ETH`.
- **THEN** la operación debe revertir, loggeando una excepción descriptiva acerca del mínimo depósito no válido.

### Requirement: Umbral de Bootstrap (Arranque de Tesorería)
Para mitigar registros de gobernanza irrelevantes (DAOs vacías) y spam, el primer depósito absoluto en la historia de la tesorería debe cumplir con un piso mínimo de capitalización.

#### Scenario: Primer Depósito por debajo del Mínimo (Bootstrap Deficiente)
- **WHEN** la tesorería está en `0 ETH` (`totalDeposited == 0`) y se intenta un depósito inicial menor a `0.05 ETH`.
- **THEN** la operación debe revertir indicando que el "Bootstrap amount is too low".

#### Scenario: Primer Depósito Exitoso (Bootstrap Válido)
- **WHEN** la tesorería está en `0 ETH` y se envía una cantidad `>= 0.05 ETH`.
- **THEN** se acepta el bloque, se indexa el peso del 100% al primer socio y se habilita la creación de propuestas.

#### Scenario: Depósitos Posteriores (Post-Bootstrap)
- **WHEN** la tesorería ya tiene fondos (`totalDeposited > 0`) y un usuario intenta depositar un monto menor al `1%` del `totalDeposited`.
- **THEN** la operación debe revertir indicando que el "Deposit amount is below 1% threshold".

#### Scenario: Depósito Válido de Seguimiento
- **WHEN** el usuario envía un monto `msg.value >= (totalDeposited * 1) / 100`.
- **THEN** se acepta el bloque, se incrementa el saldo individual y el global, y se emite el evento `Deposited`.
