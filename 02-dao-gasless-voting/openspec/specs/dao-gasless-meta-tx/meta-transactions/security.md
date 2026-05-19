# Seguridad y Hardening

Esta especificación detalla las medidas de seguridad implementadas en el sistema Gasless.

## Protecciones del Relayer (`/api/relay`)

### 1. Validación de Firma EIP-712
El Relayer NO confía en la firma a ciegas.
- Verifica off-chain que la firma corresponda al `from` especificado en el `ForwardRequest`.
- Utiliza una instancia de `MinimalForwarder` (via `ethers.Contract`) para verificar los parámetros antes de enviar la transacción.

### 2. Control de Acceso (Whitelisting)
El Relayer restringe las funciones a las que se puede llamar.
- **Whitelist**: `vote(uint256,uint8)`, `createProposal(address,uint256,string)`.
- Si el `to` no es el `DAOVoting` o el `data` (calldata) no corresponde a estas funciones, se rechaza la solicitud.

### 3. Prevención de Replay Attacks
- **Nonces base**: El `MinimalForwarder` mantiene un nonce por cada usuario que se incrementa en cada ejecución exitosa.
- **Validación off-chain del nonce**: El Relayer verifica que el nonce enviado sea el actual antes de gastar gas.

### 4. Límites de Gas y Balances
- **Simulación previa**: El Relayer simula la ejecución (`estimateGas`) antes de enviarla on-chain.
- **Gas Limit**: Se impone un límite de `1,000,000` de gas para prevenir ataques de consumo infinito.
- **Safe Balance Check**: El Relayer verifica que tiene al menos `0.01 ETH` para cubrir la transacción.

### 5. Doble Ejecución (Frontend)
El Hook `useGasless` utiliza una bandera `isProcessing` para bloquear clics duplicados mientras una firma o envío está en curso.

## Seguridad del Smart Contract

### 1. `MinimalForwarder.sol`
- Implementa `EIP-712` para firmas legibles y seguras.
- Utiliza `ECDSA.recover` para verificar el firmante.
- Garantiza que el `msg.sender` del contrato `DAOVoting` sea el firmante original mediante el protocolo `EIP-2771`.

### 2. `DAOVoting.sol`
- Hereda de `ERC2771Context`.
- Utiliza `_msgSender()` en lugar de `msg.sender` en todas las funciones críticas (`vote`, `createProposal`, `deposit`).
- Protege las funciones de administración mediante `onlyOwner`.

## Seguridad de la Sesión del Navegador

### 1. Invalidación de Sesión al Perder Wallet
- **Sincronización `accountsChanged`**: La dApp confía netamente en que cualquier cambio externo que borre la identidad del proveedor (como un logout manual desde los Settings de MetaMask) se trate con igual seriedad térmica. 
- Activa `resetWalletState` de forma obligatoria, destruyendo instantáneamente toda persistencia temporal y deshabilitando la capacidad local de seguir firmando payloads sin conexión activa.

### 2. Prevención de Acciones sin Cuenta Activa
- Un usuario deslogueado a nivel wallet automáticamente transiciona a la pantalla _Landing_. 
- Acciones como iniciar firma Gasless se prohíben mediante chequeos exhaustivos de `!address` en hook para evitar inyecciones EIP-712 a cuentas nulas.
