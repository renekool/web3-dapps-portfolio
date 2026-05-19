# Dezentra

DApp de intercambio P2P de tokens ERC20 donde el contrato actúa como **custodio neutral**. El "Creador" deposita sus tokens y el "Ejecutor" entrega los suyos. El contrato libera ambos atómicamente o devuelve todo si se cancela. Sin AMM, sin pools, sin slippage: swap bilateral determinístico.

---

## 📋 Índice

- [Estructura del Proyecto](#estructura-del-proyecto)
- [Smart Contract](#smart-contract)
- [Tokens de Prueba](#tokens-de-prueba)
- [Frontend](#frontend)
- [Flujo de Swap Completo](#flujo-de-swap-completo)
- [FSM de Transacciones](#fsm-de-transacciones)
- [Seguridad](#seguridad)
- [Configuración y Deployment](#configuración-y-deployment)
- [Tests](#tests)
- [Cuentas de Prueba](#cuentas-de-prueba)
- [Comandos de Referencia](#comandos-de-referencia)

---

## 📁 Estructura del Proyecto

```
04-escrow-doing/
├── sc/                              # Smart contracts (Foundry)
│   ├── src/
│   │   ├── Escrow.sol               # Contrato principal
│   │   └── tokens/
│   │       ├── TokenA.sol           # ERC20 de prueba (18 decimales)
│   │       └── TokenB.sol           # ERC20 de prueba (18 decimales)
│   ├── test/
│   │   ├── Escrow.t.sol             # 27 tests unitarios
│   │   ├── TokenA.t.sol
│   │   ├── TokenB.t.sol
│   │   └── helpers/
│   │       └── MockFeeToken.sol     # ERC20 con fee-on-transfer (solo tests)
│   ├── script/
│   │   └── Deploy.s.sol             # Script de deploy
│   └── foundry.toml
│
├── web/                             # Frontend Next.js 14
│   ├── app/
│   │   ├── page.tsx                 # Redirect a /dashboard
│   │   └── dashboard/
│   │       ├── page.tsx             # Entry point (server component)
│   │       └── DashboardPage.tsx    # Lógica principal del dashboard
│   ├── components/
│   │   ├── OperationCard.tsx        # Tarjeta de operación con acciones
│   │   ├── admin/
│   │   │   └── AddToken.tsx         # Panel de admin (solo owner)
│   │   ├── operations/              # Formulario crear operación
│   │   ├── stats/                   # Cards de estadísticas
│   │   ├── wallet/                  # Botón de conexión de wallet
│   │   └── modern-ui/               # Sistema de diseño (Button, Card, Badge…)
│   └── lib/
│       ├── contracts.ts             # ABI + direcciones (auto-generado por deploy.sh)
│       ├── ethereum.tsx             # EthereumContext: provider, signer, listeners
│       ├── errors.ts                # Mapper de revert reasons → mensajes humanos
│       ├── mockData.ts              # Tipos compartidos (EscrowState, Token, MockOperation)
│       └── utils.ts                 # formatAmount, parseFormattedBalance
│
├── deploy.sh                        # Orquestador: Anvil + deploy + mint + web
├── DESIGN.md                        # Sistema de diseño visual
└── CLAUDE.md                        # Gobernanza del proyecto
```

---

## 🔗 Smart Contract

### Escrow.sol

Contrato custodial que retiene tokens del Creator hasta que el Executor cumple.

```solidity
contract Escrow is ReentrancyGuard, Ownable, Pausable
```

**Herencia OpenZeppelin:**
- `ReentrancyGuard` — protección contra ataques de reentrancia en todas las funciones mutadoras
- `Ownable` — control de acceso para `addToken`, `pause`, `unpause`
- `Pausable` — modo de emergencia: bloquea `createOperation` y `completeOperation`; `cancelOperation` siempre disponible

#### Struct Operation

```solidity
struct Operation {
    uint256 id;
    address creator;     // quien ofrece el swap
    address tokenA;      // token que ofrece el creator
    address tokenB;      // token que quiere recibir
    uint256 amountA;     // cantidad ofrecida
    uint256 amountB;     // cantidad pedida
    State   state;       // Active | Completed | Cancelled
    address executor;    // quien completó el swap (address(0) si no completado)
    uint256 createdAt;   // timestamp de creación
    uint256 closedAt;    // timestamp de cierre (0 si aún Active)
    uint256 deadline;    // expiración Unix timestamp
}
```

#### Ciclo de vida

```
                    completeOperation()
              ┌────────────────────────────► Completed
              │      (executor ≠ creator)
   Active ────┤
              │
              └────────────────────────────► Cancelled
                    cancelOperation()
                    (solo creator)
```

Las transiciones son **unidireccionales** — no se puede reabrir ni revertir una operación cerrada.

#### Funciones

| Función | Acceso | Descripción |
|---|---|---|
| `addToken(address)` | `onlyOwner` | Registra un token en la allowlist |
| `getAllowedTokens()` | público | Retorna el array de tokens permitidos |
| `createOperation(tokenA, tokenB, amountA, amountB, deadline)` | cualquier wallet | Deposita `amountA` de `tokenA` y crea la operación |
| `completeOperation(uint256 id)` | cualquier wallet ≠ creator | Transfiere `amountB` al creator, libera `amountA` al executor |
| `cancelOperation(uint256 id)` | solo creator | Devuelve `amountA` al creator |
| `getAllOperations()` | público | Retorna todas las operaciones (nunca revierte) |
| `pause()` / `unpause()` | `onlyOwner` | Control de emergencia |

#### Eventos

```solidity
event TokenAdded(address indexed token);
event OperationCreated(uint256 indexed id, address indexed creator, address tokenA, address tokenB, uint256 amountA, uint256 amountB);
event OperationCompleted(uint256 indexed id, address indexed executor);
event OperationCancelled(uint256 indexed id);
```

---

## 🪙 Tokens de Prueba

Desplegados exclusivamente en Anvil (chainId 31337). No tienen restricciones de minteo — son para desarrollo local.

| Token | Símbolo | Decimales | Ubicación |
|---|---|---|---|
| TokenA | TKA | 18 | `sc/src/tokens/TokenA.sol` |
| TokenB | TKB | 18 | `sc/src/tokens/TokenB.sol` |

`deploy.sh` mintea automáticamente **1,000 TKA** y **1,000 TKB** a las 3 cuentas de prueba.

> `Escrow.sol` solo conoce `IERC20` — sin acoplamiento estático con TokenA ni TokenB.

---

## 🌐 Frontend

**Stack:** Next.js 14 (App Router), ethers.js v6, Tailwind v4

### EthereumContext (`web/lib/ethereum.tsx`)

Estado global de wallet. Provee `provider`, `signer`, `account`, `status` y `ownerAddress` a toda la app.

```typescript
type WalletStatus = "disconnected" | "connecting" | "connected" | "wrong-network";
```

**Listeners de wallet:**
- `accountsChanged` → reconstruye `BrowserProvider` + `getSigner()` para sincronizar el signer con la cuenta activa en MetaMask
- `chainChanged` → recarga la página
- `removeListener` al desmontar — sin memory leaks

### Componentes principales

| Componente | Responsabilidad |
|---|---|
| `DashboardPage.tsx` | Orquestador: carga operaciones, balances, maneja TX |
| `OperationCard.tsx` | Tarjeta con acciones contextuales (Ejecutar / Cancelar) según rol |
| `AddToken.tsx` | Panel de admin visible **solo para el owner** del contrato |
| `errors.ts` | Mapea todos los revert reasons a mensajes legibles — nunca muestra hex raw |

### Mapper de errores (`web/lib/errors.ts`)

| Revert reason | Mensaje mostrado al usuario |
|---|---|
| `"Tokens must differ"` | "No puedes intercambiar un token por sí mismo" |
| `"Amounts > 0"` | "El monto debe ser mayor a cero" |
| `"Operation expired"` | "Esta oferta de swap ha expirado" |
| `"Not active"` | "Esta operación ya no está disponible" |
| `"Not creator"` | "Solo el creador puede cancelar esta operación" |
| `"Is creator"` | "No puedes completar tu propia operación" |
| `"Token not allowed"` | "Este token no está autorizado para operar" |
| `"Fee-on-transfer not allowed"` | "Este token no es compatible con el escrow" |
| `ERC20InsufficientAllowance` | "Aprueba la transferencia del token primero" |
| `ERC20InsufficientBalance` | "Saldo insuficiente para esta operación" |
| User rejected | *(silencioso — sin toast de error)* |

---

## 🔄 Flujo de Swap Completo

### Crear una operación (Creator)

```
1. Creator selecciona tokenA, tokenB, amountA, amountB
   Deadline: 7 días desde el momento de creación

2. Pre-flight: validación de saldo en frontend (balanceOf)
   → Saldo insuficiente → error visual, sin popup de wallet

3. Verificar allowance actual de tokenA:
   → Si allowance > 0: approve(escrow, 0) + wait()   [reset]
   → approve(escrow, amountA) + wait()

4. createOperation(tokenA, tokenB, amountA, amountB, deadline)
   → Escrow: transferFrom(creator → escrow, amountA)
   → Emite OperationCreated

5. Operación aparece en el dashboard con estado "Active"
```

### Ejecutar una operación (Executor)

```
1. Executor ve una operación Active (no creada por él)

2. Pre-flight: validación de saldo de tokenB en frontend
   → Saldo insuficiente → error visual con detalle (tienes X, necesitas Y)

3. Modal de confirmación con detalles del swap

4. Verificar allowance actual de tokenB:
   → Si allowance > 0: approve(escrow, 0) + wait()   [reset]
   → approve(escrow, amountB) + wait()

5. completeOperation(id)
   → Escrow: transferFrom(executor → creator, amountB)
   → Escrow: transfer(escrow → executor, amountA)
   → Emite OperationCompleted

6. Operación pasa a estado "Completed"
```

### Cancelar una operación (Creator)

```
1. Creator cancela su propia operación Active

2. cancelOperation(id)   [una sola firma]
   → Escrow: transfer(escrow → creator, amountA)
   → Emite OperationCancelled

3. Operación pasa a estado "Cancelled"
```

---

## 🔧 Configuración y Deployment

### Prerrequisitos

- Node.js 20+
- Foundry (`forge`, `cast`, `anvil`)
- MetaMask o Rabby (extensión de navegador)

### Deployment con un solo comando

```bash
./deploy.sh
```

El script hace todo automáticamente:
1. Verifica si Anvil está corriendo — si no, lo levanta en background
2. Libera el puerto 3000 si está ocupado
3. Compila los contratos (`forge build`)
4. Deploya TokenA, TokenB y Escrow en Anvil
5. Registra los tokens en la allowlist del Escrow
6. Mintea tokens a las 3 cuentas de prueba
7. Actualiza `web/lib/contracts.ts` con las nuevas direcciones
8. Levanta el servidor Next.js en `http://localhost:3000`

**Output esperado:**
```
[✓] Anvil already running
[✓] Building contracts
[✓] Deploying Tokens
    Token A: 0x4EE6...07B
    Token B: 0xBEc4...0f25
[✓] Deploying Escrow
    Escrow:  0xD843...5889
[✓] Registering tokens in Escrow
[✓] Minting initial supply to accounts
[✓] Updating frontend configuration
[✓] Web application started (PID: XXXXX)
✨ Deployment and startup successful!
URL: http://localhost:3000
```

### Configurar MetaMask

1. Agregar red Anvil:
   - **RPC URL:** `http://localhost:8545`
   - **Chain ID:** `31337`
   - **Símbolo:** `ETH`

2. Importar cuentas de prueba (cuenta #0 es el owner del contrato):
   ```
   #0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   #1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   #2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
   ```

3. Agregar TokenA y TokenB a MetaMask usando las direcciones del output del deploy.

---

## 🧪 Tests

### Smart Contracts (Foundry)

```bash
cd sc
forge test              # Ejecutar todos los tests
forge test -vvv         # Con trazas detalladas
forge coverage          # Reporte de cobertura
```

**Cobertura — 100% en todas las métricas:**

| Archivo | Líneas | Statements | Branches | Funciones |
|---|---|---|---|---|
| `Escrow.sol` | 100% (42/42) | 100% (36/36) | 100% (20/20) | 100% (8/8) |
| `TokenA.sol` | 100% (4/4) | 100% (2/2) | 100% (0/0) | 100% (2/2) |
| `TokenB.sol` | 100% (4/4) | 100% (2/2) | 100% (0/0) | 100% (2/2) |
| `MockFeeToken.sol` | 100% (9/9) | 100% (10/10) | 100% (1/1) | 100% (2/2) |
| **Total** | **100% (59/59)** | **100% (50/50)** | **100% (21/21)** | **100% (14/14)** |

**Suite — 31 tests, todos en verde:**

| Grupo | Tests | Qué verifica |
|---|---|---|
| addToken | 3 | Solo owner puede agregar; `getAllowedTokens` retorna correctamente |
| createOperation | 5 | Happy path, tokenA==tokenB, amount==0, token no permitido, evento |
| completeOperation | 4 | Happy path, creator no puede completar, no activa, evento |
| cancelOperation | 4 | Happy path, no creator, no activa, evento |
| fee-on-transfer | 1 | MockFeeToken revierte con "Fee-on-transfer not allowed" |
| deadline | 4 | Revierte si expirada, completa antes del deadline, deadline en pasado, cancel post-deadline |
| pausable | 4 | Pausa bloquea create, cancel disponible, unpause restaura, solo owner pausa |

### Frontend

```bash
cd web
npm run typecheck   # TypeScript strict — 0 errores
npm run build       # Build de producción — 0 errores
npm run lint        # ESLint
```

---

## 👤 Cuentas de Prueba

> ⚠️ Solo para Anvil local. Nunca usar en mainnet o testnet.

| Cuenta | Dirección | Rol |
|---|---|---|
| #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Owner del contrato |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Creator / Executor |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Creator / Executor |

Cada cuenta recibe **1,000 TKA** y **1,000 TKB** al ejecutar `deploy.sh`.

---

## ⚙️ Comandos de Referencia

```bash
# Smart Contracts
cd sc
forge build                          # Compilar
forge test                           # Ejecutar tests
forge test -vvv                      # Tests con trazas
forge coverage --report summary      # Cobertura

# Frontend
cd web
npm run dev                          # Servidor de desarrollo
npm run build                        # Build de producción
npm run typecheck                    # Verificación TypeScript
npm run lint                         # Linter

# Blockchain local
anvil                                # Iniciar Anvil (localhost:8545, chainId 31337)
cast chain-id --rpc-url http://localhost:8545   # Verificar que Anvil está corriendo

# Deploy completo (todo en un comando)
./deploy.sh
```

---

## 🛠️ Stack Técnico

| Componente | Tecnología |
|---|---|
| Smart Contract | Solidity 0.8.20 |
| Framework SC | Foundry |
| Librería SC | OpenZeppelin Contracts |
| Red local | Anvil (chainId 31337) |
| Frontend | Next.js 14 (App Router) |
| Librería Web3 | ethers.js v6 |
| Estilos | Tailwind CSS v4 |
| Lenguaje | TypeScript (strict) |
| Wallet | MetaMask / Rabby |

---

## Author

Creado y mantenido por **René Orellana**

---

## Contact

Si tienes dudas, sugerencias o te gustaría colaborar, puedes contactar con:

**René Orellana**  
Email: t4mmg120@hotmail.com
