# Especificación de Migración a Sepolia — TruXign

Este documento define la arquitectura, el flujo y el alcance técnico para la migración del sistema TruXign desde el entorno de desarrollo local (Anvil) hacia la red de prueba Sepolia (Ethereum Testnet).

---

## 1. Arquitectura Objetivo (Sepolia)

La arquitectura de producción para esta fase se basa en la inyección de identidad externa y conectividad con nodos remotos.

- **Wallet Identity:** Uso de wallet real (MetaMask / Rabby) como único proveedor de identidad y firma.
- **Provider Layer:** Sustitución de `JsonRpcProvider` (local) por `BrowserProvider` (EIP-1193) para interactuar con la wallet instalada.
- **Signer:** El `signer` es dinámico y depende exclusivamente de la aprobación del usuario en el navegador.
- **Network Layer:**
    - **Chain ID:** 11155111 (Sepolia).
    - **Smart Contract:** Contrato `DocumentRegistry` desplegado y verificado en Sepolia.

### 🛡️ Decisiones Arquitectónicas Oficiales
1. **Desacoplamiento de Contrato (Opción B):** El `Web3Context` NO expondrá la instancia del contrato. Expondrá únicamente el core Web3 (signer, address, status). La instancia del contrato se construirá en una capa de servicio o hook dedicado para mantener la separación de responsabilidades y evitar el "God Object".
2. **Fuente de Verdad:** Identidad 100% inyectada. No se permiten claves privadas locales ni cuentas mock.

---

## 2. Modelo de Estado Oficial (Contrato de Sistema)

### Global Web3 Status (`walletStatus`)
- `idle`: Detectando extensiones.
- `unavailable`: `window.ethereum` no detectado (Mostrar CTA de instalación).
- `disconnected`: Wallet detectada pero bloqueada.
- `connecting`: Handshake de permisos activo.
- `connected`: Identidad vinculada.
- `wrong_network`: Red distinta a 11155111.

### Transaction Lifecycle Status (`txStatus`)
- `idle`: Sin operaciones.
- `signing`: Esperando aprobación en la wallet.
- `submitting`: Transacción enviada; esperando receipt hash.
- `confirming`: Esperando confirmación de bloque.
- `success`: Confirmada on-chain.
- `error`: Fallo técnico o cancelación.

---

## 3. Comportamiento ante Eventos Wallet (MVP Policy)

### 3.1 Cambio de Cuenta (`accountsChanged`)
**Política de Reset Parcial:**
- **SE RESETEA:** Firma actual (la firma es inválida para la nueva cuenta), TX Hash actual, Historial cargado.
- **SE PRESERVA:** Hash calculado del archivo, Archivo en memoria, Preview visual, Ruta actual.
- **Justificación:** El archivo cargado es una acción del usuario (UX) independiente de la identidad wallet, pero la firma es un compromiso criptográfico ligado a la cuenta.

### 3.2 Cambio de Red (`chainChanged`)
**Política de Full Reload (Opción A):**
- **Acción:** `window.location.reload()`.
- **Justificación:** Es la estrategia más robusta para asegurar que los objetos internos de `ethers` e instancias de contrato se re-hidraten con el contexto de red correcto, evitando estados corruptos o cross-network errors.

---

## 4. Matriz de Estados UX y Feedback Asíncrono

Esta sección define el comportamiento visual y operativo durante las acciones críticas del sistema.

| Flujo | Estado UX | Comportamiento Visual | Bloqueos | Permite | Persistencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Upload** | `processing` | Skeleton/Spinner en área de drop. | No subir otro archivo. | Navegar. | Nombre/Tamaño del archivo. |
| **Upload** | `hashing` | "Calculando Hash..." | No subir otro archivo. | Navegar. | Archivo en memoria. |
| **Sign** | `waiting_wallet` | Banner: "Revisa tu extensión Wallet". | Re-click en Sign. | Cerrar modal. | Archivo + Hash. |
| **Sign** | `success` | Badge "Signed" + Botón "Store" habilitado. | - | Todo. | Archivo + Hash + Firma. |
| **Store** | `submitting` | Spinner: "Enviando transacción...". | Todos los CTAs. | Solo Lectura. | Hash + Firma. |
| **Store** | `confirming` | Loader: "Confirmando en Sepolia (~12s)". | Todos los CTAs. | Navegar (Lectura).| Hash + Firma + TxHash. |
| **Verify** | `searching` | Spinner: "Consultando Blockchain...". | Re-click en Verify. | - | Archivo de búsqueda. |
| **History** | `loading` | Skeleton rows en tabla. | - | Acciones fuera de tabla.| - |

### 🚨 Regla Crítica de Feedback
- **Cancelación de Firma:** Si el usuario rechaza la firma en la wallet (`user rejected`), el sistema debe volver a estado `idle` pero **preservar el archivo y el hash** para que el usuario pueda intentar firmar de nuevo sin cargar el archivo otra vez.
- **Error de Transacción:** Si la TX falla on-chain (ej. gas insuficiente), se debe mostrar un Toast de error descriptivo pero **preservar el txHash fallido para consulta** hasta que el usuario inicie un nuevo proceso.

---

## 5. Reglas de Bloqueo UI durante Operaciones (Resumen)

| Estado | Botones de Acción | Navegación | Datos (Hash/Firma) |
| :--- | :--- | :--- | :--- |
| `signing` | Deshabilitados | Permitida (con Warning) | Preservados |
| `submitting` | Deshabilitados (Spinning) | Bloqueda (Escritura) | Preservados |
| `confirming` | Deshabilitados (Spinning) | Permitida (Lectura) | Preservados |
| `success` | Desbloqueados (Reset) | Libre | Reset a Idle |
| `error` | Desbloqueados (Retry) | Libre | Preservados |

---

## 6. Caso: Wallet Unavailable

### Comportamiento frente a `window.ethereum === undefined`:
- **Estado:** La app entra en `walletStatus = unavailable`.
- **UI:** Muestra banner informativo o botón "Install MetaMask/Rabby" en el área de login.
- **Restricción:** Se deshabilitan todas las funciones de Firma y Almacenamiento.

---

## 7. Alcance Final de Implementación (MVP)

### ✅ Incluido
- Conexión real, validación Sepolia, estados TX realistas, despliegue oficial.
- Feedback visual de latencia de red real.
### ❌ Excluido
- Gasless, Relayer, AA, IPFS, Backend, Multi-red.

---

## 8. MVP Técnico (Secuencial)

1. **Web3Core:** `Web3Context` con estados formales y listeners EIP-1193.
2. **Access Layers:** Guards de red y wallet.
3. **Identidad UI:** Home adaptada a conexión inyectada.
4. **On-chain:** Contract deployment en Sepolia.
5. **E2E:** Validación de flujo completo.
