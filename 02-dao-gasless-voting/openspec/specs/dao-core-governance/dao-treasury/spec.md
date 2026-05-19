## ADDED Requirements

### Requirement: Registro Inmutable de Contribuciones
Todo integrante puede inyectar valor (ETH) a la Tesorería. Estos depósitos se consolidan permanentemente, incrementando su derecho en el Pool sin contemplar métodos de reversión ni rescate del depósito inicial.

#### Scenario: Depositando Fondos Exitosamente a la DAO
- **WHEN** un miembro invoca el método \`deposit()\` enviando valor EVM nativo (`msg.value > 0`).
- **THEN** su saldo personal depositado se indexa en proporción y el balance general de la tesorería es actualizado.

#### Scenario: Intento de Depósito Vacío
- **WHEN** un miembro trata de añadir liquidez con cantidad `0 ETH`.
- **THEN** la operación debe revertir, loggeando una excepción descriptiva acerca del mínimo depósito no válido.
