# Security & Mitigation Strategy: Gasless Transactions

## 1. Replay Attacks
**Estrategia**: Implementacion de Nonce Incremental.
**Mecanica**:
- Cada usuario tiene un `nonce` unico en el contrato `MinimalForwarder`.
- El Relayer rechaza nonces incorrectos.
- La firma EIP-712 incluye el nonce, invalidando firmas previas una vez ejecutadas.

## 2. Whitelist de Destino y Funciones (Relayer Security)
**Estrategia**: Restriccion del campo `to` y `calldata` en el Relayer API.
- **Restriccion de Destino**: Solo se permite `to === DEPLOYED_DAO_ADDRESS`.
- **Whitelist de Funciones**: El Relayer DEBE decodificar el `calldata` y solo permitir:
  - `vote(uint256,uint8)`
  - `createProposal(address,uint256,string) / fundDAO()` 
**Objetivo**: Evitar que el Relayer sea usado para pagar gas de transacciones ajenas al DAO o funciones administrativas no autorizadas.

## 3. Gas Strategy
**Estrategia**: Definicion deterministica de limites de gas.
- **Calculo**: `Gas Limit = estimateGas * 1.2` (Margen de seguridad del 20%).
- **Hard Cap**: `MAX_RELAYER_GAS = 1,000,000`. Cualquier solicitud que supere este limite sera rechazada antes de firma si es posible, o por el relayer imperativamente.
**Objetivo**: Prevenir ataques de drenado de fondos (gas griefing) mediante funciones maliciosas de alto costo.

## 4. Validacion de Dominio (Cross-Chain Safety)
**Estrategia**: EIP-712 Domain Separator.
**Restriccion**: Incluir `chainId` en la firma.
**Objetivo**: Garantizar que una firma generada para Anvil (31337) no sea valida en Mainnet o Testnet.

## 5. Control de Abuso (Rate Limiting)
**Estrategia**: Cuotas de Solicitud.
**Restriccion**: Maximo 1 peticion / segundo por IP/Wallet en el endpoint `/api/relay`.
**Objetivo**: Prevenir bots y spam masivo al relayer.
