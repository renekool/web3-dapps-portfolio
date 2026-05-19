# Tasks: dao-gasless-meta-tx

## 1. Setup & Dependencies
- [x] 1.1 Verificar que `ERC2771Context` y `MinimalForwarder` de OpenZeppelin sean accesibles en `lib/`.
- [x] 1.2 Crear `contracts/src/MinimalForwarder.sol` (si se usa una instancia local para la DAO).

## 2. Upgrade DAOVoting Contract
- [x] 2.1 Modificar `DAOVoting.sol` para heredar de `ERC2771Context`.
- [x] 2.2 Actualizar el constructor para aceptar la dirección del `forwarder` e inicializar el contrato base: `ERC2771Context(forwarder)`. Asegurar que el forwarder solo se configure aquí y que no exista un setter (Inmutabilidad).
- [x] 2.3 Implementar los overrides requeridos para `_msgSender()` y `_msgData()` para resolver cualquier conflicto interno de `Context` y asegurar el comportamiento correcto de EIP-2771.
- [x] 2.4 Refactorizar `msg.sender` a `_msgSender()` en las funciones lógicas de identidad:
    - [x] `createProposal()` (Validación del 1% y registro de proponente).
    - [x] `vote()` (Identidad del votante y peso de voto).
    - [x] *Nota*: Mantener `deposit()` operando con `msg.sender` / `msg.value` nativo para preservar la transferencia de valor real del usuario.
    - [x] *Nota*: `executeProposal()` no requiere `_msgSender()` para la lógica de fondos (usa el `recipient` de la propuesta), pero puede usarse para registrar quién disparó la ejecución.
- [x] 2.5 Emitir un evento `TrustedForwarderUpdated(address forwarder)` en el constructor.

## 3. Implementation of MinimalForwarder
- [x] 3.1 Implementar o importar `MinimalForwarder.sol` soportando firmas estructuradas EIP-712.

## 4. Testing & Validation (Foundry)
- [x] 4.1 Actualizar `contracts/test/DAOVoting.t.sol` o crear un nuevo archivo de prueba `contracts/test/GaslessDAO.t.sol`.
- [x] 4.2 Probar el `deposit()` tradicional para asegurar la retrocompatibilidad.
- [x] 4.3 Implementar una utilidad de prueba para firmar mensajes EIP-712 en Foundry.
- [x] 4.4 Probar la Votación Gasless: 
    - [x] Crear una firma para votar.
    - [x] Hacer que un "relayer" (dirección diferente al votante) llame al forwarder.
    - [x] Asegurar que el voto se atribuyó correctamente al firmante.
- [x] 4.5 Probar la protección contra replay: Intentar usar la misma firma dos veces y asegurar que falle.
- [x] 4.6 Verificar la accesibilidad de `executeProposal`: Asegurar que cualquier dirección pueda ejecutarla después del timelock, independientemente del forwarder.
