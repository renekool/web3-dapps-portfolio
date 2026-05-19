# Flujos de Usuario y Fallback

Esta especificación describe los flujos de interacción del usuario con el sistema Gasless.

## 1. Flujo de Transacción Gasless (Éxito)

1. **GIVEN** El usuario tiene activado el `GaslessToggle`.
2. **WHEN** Hace clic en "Vote" o "Create Proposal".
3. **AND** Firma la solicitud EIP-712 en su wallet (MetaMask/Rabby).
4. **THEN** La solicitud firmada se envía al `/api/relay`.
5. **AND** El Relayer ejecuta la transacción on-chain pagando el gas.
6. **AND** El `GaslessOverlay` muestra el estado "Relaying" y finalmente "Success!".

## 2. Flujo de Fallback Controlado (Infraestructura)

Si el Relayer no puede procesar la transacción por problemas técnicos:

1. **GIVEN** El usuario lanza una acción Gasless.
2. **WHEN** El Relayer responde con `RELAYER_INSUFFICIENT_FUNDS`, `TIMEOUT` o un error de red.
3. **THEN** El `useGasless` Hook transiciona al estado `fallback_pending`.
4. **AND** El `GaslessOverlay` muestra un aviso de que el sistema Gasless no está disponible.
5. **AND** Ofrece dos opciones al usuario:
   - **Pay Own Gas & Continue**: Ejecuta la transacción directamente desde el wallet del usuario (pagando gas).
   - **Cancel**: Aborta la operación y vuelve al estado `idle`.
6. **THEN** El usuario debe dar su **consentimiento explícito** antes de pagar gas.

## 3. Flujo Directo (Manual)

Si el usuario prefiere no usar Gasless:

1. **GIVEN** El usuario desactiva el `GaslessToggle`.
2. **WHEN** Ejecuta una acción.
3. **THEN** Se dispara una transacción estándar de Ethereum/Wagmi.
4. **AND** El usuario paga su propio gas.
5. **AND** El `GaslessOverlay` muestra los estados tradicionales de "Signing" y "Confirming".

## Decisiones Críticas

- **Sin Fallback Automático**: El sistema NUNCA debe intentar cobrar gas al usuario sin que este lo acepte explícitamente.
- **Errores Críticos**: Errores como `INVALID_SIGNATURE` o `EXECUTION_FAILED` (revert del contrato) NO disparan fallback, ya que reintentar directamente fallará igualmente.

## 4. Flujo de Wallet Disconnect (External)

Si el usuario hace logout directo desde MetaMask:

1. **GIVEN** La dApp está conectada a la wallet.
2. **WHEN** El usuario desconecta su cuenta en la extensión del proveedor (ej. `accountsChanged -> []`).
3. **THEN** La dApp detecta el evento EIP-1193 y aborta cualquier transacción pendiente.
4. **AND** Resetea permanentemente el estado global de la sesión (ej: `useDAOStore.resetWalletState()`).
5. **AND** El usuario es redirigido automáticamente al landing page `/`.
6. **AND** Las preferencias modulares como `gaslessPreference` se mantienen en local storage intactas para su retorno.
