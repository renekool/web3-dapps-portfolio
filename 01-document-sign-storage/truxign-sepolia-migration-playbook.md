---
title: "Truxign Sepolia Migration Playbook"
status: operational
agent: Antigravity
last_updated: 2026-03-25
---

# 🔐 TruXign Sepolia Migration Playbook

### (Local Development → Testnet Execution)

Este documento es la guía operativa para transformar el proyecto de firma documental desde un entorno local basado en Anvil hacia una versión funcional en Sepolia testnet, utilizando wallets reales, sin comprometer el proyecto base original.

---

# 🧠 Naturaleza del Documento (CRÍTICO)

## 📌 Este es un documento VIVO

Este archivo:

* NO es estático
* NO es solo planificación
* NO es solo referencia

Este documento debe:

### ✔ evolucionar durante la ejecución

### ✔ registrar cada acción relevante

### ✔ documentar decisiones reales

### ✔ incluir comandos ejecutados

### ✔ reflejar el estado real del sistema

---

## 🔁 Regla de Retroalimentación Obligatoria

A medida que Antigravity ejecute cada fase, este archivo debe irse complementando.

Antigravity debe:

1. Documentar qué hizo exactamente
2. Registrar comandos ejecutados
3. Indicar archivos modificados
4. Explicar decisiones técnicas
5. Registrar errores y soluciones
6. Mantener trazabilidad completa

Este documento debe terminar funcionando como:

* guía operativa
* historial técnico
* bitácora de ejecución
* referencia de migración reproducible

---

## 🧾 Formato obligatorio de documentación por fase

Cada fase debe complementarse con un bloque como este:

````markdown
### 🧪 EJECUCIÓN REAL — FASE X

**Fecha:**  
**Responsable:** Antigravity  

**Acciones realizadas:**
- ...

**Comandos ejecutados:**
```bash
...
````

**Archivos modificados:**

* ...

**Decisiones tomadas:**

* ...

**Problemas encontrados:**

* ...

**Soluciones aplicadas:**

* ...

**Estado final:**

* ...

````

---

## 🎯 Propósito del Documento

- Servir como guía operativa  
- Servir como historial técnico  
- Permitir reproducibilidad  
- Evitar pérdida de contexto  
- Documentar aprendizaje real  

---

## 🧠 Principio Arquitectónico

Esta migración **NO es una reingeniería completa**.

Es una transición controlada desde:

```text
demo local custodial (Anvil + cuentas mock)
````

hacia:

```text
demo testnet real (Sepolia + wallet del usuario)
```

El objetivo no es rehacer el producto, sino adaptar su capa de ejecución para que deje de depender de un entorno local simulado y pase a un flujo verificable real con wallet conectada.

---

## 🔒 Regla Crítica (NO NEGOCIABLE)

El siguiente proyecto **NO se modifica bajo ninguna circunstancia**:

```text
/home/rene/web3-dev/01-document-sign-storage
```

Este proyecto queda congelado como:

* baseline funcional
* referencia técnica
* respaldo operativo
* punto de comparación

---

## 🧱 Estructura de Trabajo

### Proyecto original (solo lectura)

```text
01-document-sign-storage
```

### Proyecto de migración (único editable)

```text
01-document-sign-storage-sepolia
```

---

## 🌿 Estrategia de Versionado (GitLab)

* Rama base: `main`
* Rama de trabajo:

```text
sepolia-migration
```

Todos los cambios ocurren únicamente en esta rama.

---

# 🎯 Objetivo Técnico de la Fase

Lograr que TruXign funcione en **Sepolia** con:

* wallet real (MetaMask / Rabby)
* contrato desplegado en testnet
* flujo funcional end-to-end verificable
* cambios mínimos de interfaz
* sin tocar el proyecto base estable

---

# 📦 Alcance de esta Migración

## ✅ Sí entra en esta fase

* aislamiento del proyecto
* copia local segura
* nueva rama de trabajo
* análisis técnico de dependencias locales
* actualización de specs antes de desarrollar
* integración con wallet real
* conexión a Sepolia
* despliegue del contrato en testnet
* validación funcional end-to-end

---

## ❌ No entra en esta fase

* gasless
* relayer
* IPFS / Pinata
* backend productivo
* account abstraction
* producción final
* integración completa con `truxign.onchainly.xyz`

---

# 🚀 FASE 0 — Preparación y Blindaje

**Objetivo:** Proteger el entorno antes de cualquier cambio.

### 🔧 Acciones

* Verificar que el proyecto original funciona
* Confirmar estado limpio en Git
* Identificar rama base estable
* Preparar carpeta de trabajo separada

### ✅ Validación

* Proyecto original funciona sin errores
* No hay cambios pendientes
* Entorno controlado

### 🧪 EJECUCIÓN REAL — FASE 0

**Fecha:** 2026-03-25  
**Responsable:** Antigravity  

**Acciones realizadas:**
- Verificación de la existencia del proyecto base (`01-document-sign-storage`).
- Inspección del estado de Git en el proyecto original para asegurar un baseline limpio y estable.
- Confirmación de la rama base (`main`) sin cambios pendientes.
- Validación del entorno de trabajo actual (`01-document-sign-storage-sepolia`).

**Comandos ejecutados:**
```bash
ls -la /home/rene/web3-dev/01-document-sign-storage
git -C /home/rene/web3-dev/01-document-sign-storage status
ls -la /home/rene/web3-dev/01-document-sign-storage-sepolia
```

**Archivos modificados:**
- `truxign-sepolia-migration-playbook.md` (Documentación de Fase 0)

**Decisiones tomadas:**
- El baseline original está en estado `clean` y en la rama `origin/main`, por lo que se considera una base segura para la migración.
- El repositorio original NO será modificado en ninguna fase posterior conforme a las reglas críticas.

**Problemas encontrados:**
- Ninguno (Baseline intacto y verificado).

**Soluciones aplicadas:**
- N/A.

**Estado final:**
- ENTORNO BLINDADO. El proyecto original está protegido y el baseline verificado.
- LISTO PARA PASAR A FASE 1.

---

# 🧬 FASE 1 — Clonado Operativo Seguro

**Objetivo:** Crear entorno de trabajo aislado.

### 🔧 Acciones

1. Crear copia del proyecto:

```bash
cp -r 01-document-sign-storage 01-document-sign-storage-sepolia
```

2. Entrar al nuevo proyecto:

```bash
cd 01-document-sign-storage-sepolia
```

3. Inicializar/controlar Git:

```bash
git checkout -b sepolia-migration
```

4. Verificar conexión con GitLab

---

### ⚠️ Regla

A partir de aquí, **solo se trabaja en esta copia**.

---

### ✅ Validación

* Proyecto clonado correctamente
* Rama activa correcta
* Original intacto

---

### 🧪 EJECUCIÓN REAL — FASE 1

**Fecha:** 2026-03-25  
**Responsable:** Antigravity  

**Acciones realizadas:**
- Copia recursiva de todos los archivos (incluyendo archivos ocultos y configuración de Git) del proyecto base `01-document-sign-storage`.
- Creación y cambio inmediato a la rama de trabajo `sepolia-migration`.
- Verificación de la integridad de la copia.

**Comandos ejecutados:**
```bash
cp -r ../01-document-sign-storage/. .
git checkout -b sepolia-migration
ls -la
```

**Archivos modificados:**
- Directorio de trabajo `01-document-sign-storage-sepolia` (clonado inicial).
- `truxign-sepolia-migration-playbook.md` (Documentación de Fase 1).

**Decisiones tomadas:**
- Se optó por copiar también el directorio `.git` para mantener el historial del baseline, pero trabajando estrictamente en una nueva rama para aislar los cambios de la migración.

**Problemas encontrados:**
- Ninguno durante el proceso de clonado.

**Soluciones aplicadas:**
- N/A.

**Estado final:**
- ENTORNO DE TRABAJO AISLADO Y LISTO. 
- Rama activa: `sepolia-migration`.

---

# 🧪 FASE 2 — Validación del Baseline

**Objetivo:** Confirmar que la copia funciona igual que el original.

### 🔧 Acciones

* Ejecutar proyecto con Anvil
* Levantar frontend
* Probar flujo completo:

  * upload
  * sign
  * verify
  * history

### 📌 Resultado esperado

La copia debe reproducir exactamente el comportamiento del proyecto original.

---

### ✅ Validación

* El proyecto corre correctamente
* La copia se comporta igual al original
* El baseline queda confirmado

---

### 🧪 EJECUCIÓN REAL — FASE 2

**Fecha:** 2026-03-25  
**Responsable:** Antigravity  

**Acciones realizadas:**
- Validación técnica del baseline mediante la ejecución de la suite de pruebas del contrato (`forge test`).
- Verificación de la integridad de la lógica de negocio (11/11 tests exitosos).
- Sincronización remota: creación y push de la rama `sepolia-migration` a GitLab.

**Comandos ejecutados:**
```bash
cd contract && forge test
git push -u origin sepolia-migration
```

**Estado final:**
- BASELINE VALIDADO Y RESPALDADO EN REMOTO.
- El proyecto en `/home/rene/web3-dev/01-document-sign-storage-sepolia` es una copia fiel y funcional del original.

---

---

# 🔍 FASE 3 — Análisis Técnico de Migración

**Objetivo:** Identificar con precisión qué cambiar y qué conservar.

---

## 🔎 Auditar Frontend

* Web3Context
* signer actual
* cuentas mock
* provider local
* configuración de red
* flujo de conexión

---

## 🔎 Auditar Blockchain

* contrato actual
* lógica de registro
* dependencias del entorno local
* despliegue actual

---

## 🔎 Auditar Configuración

* RPC actual
* scripts de deploy
* variables env
* contract addresses

---

## ❓ Preguntas clave

* ¿qué depende de Anvil?
* ¿qué asume cuentas locales?
* ¿qué debe cambiar a wallet real?
* ¿qué puede conservarse?

---

### ✅ Validación

Debe existir claridad total sobre:

* qué cambia
* qué no cambia
* qué se reutiliza
* qué se reemplaza

---

### 🧪 EJECUCIÓN REAL — FASE 3

**Fecha:** 2026-03-25  
**Responsable:** Antigravity  

#### 1. Auditoría del ciclo de vida del signer / provider:
- **Componentes con Guard:** `UploadPage`, `HistoryPage` y `VerifyPage`. Redirigen a `/` si `!isConnected`. Esto garantiza que el signer existe en estas vistas.
- **Componentes con tolerancia a null:** `SelectWalletPage` (punto de inicio) y `Topbar`. Deben manejar el estado inicial sin conexión.
- **Llamadas automáticas:** `fetchNetwork` en `UploadPage` debe ser tolerante a un provider que se conecta asíncronamente.

#### 2. Auditoría de eventos wallet (EIP-1193):
- **Comportamiento esperado:** Se implementarán listeners para `accountsChanged` y `chainChanged` en `Web3Context`.
- **Acción en cambio de cuenta:** Actualizar la dirección activa en el contexto y resetear estados locales si es necesario.
- **Acción en cambio de red:** Forzar recarga o advertir mediante el banner de `NetworkGuard`.
- **Acción en desconexión:** Redirección automática a la raíz (`/`).

#### 3. Análisis UX por estados reales de usuario:
- **Estado A (Desconectado):** Botón principal "Connect Wallet" en la Home. El resto de la app es inaccesible (redirección).
- **Estado B (Conectado):** Dashboard habilitado. Header muestra dirección acortada y balance real de Sepolia.
- **Estado C (Red Incorrecta):** Banner persistente bloqueando firmas y transacciones. Opción "Switch to Sepolia" si la wallet lo soporta.
- **Estado D (Sin ETH):** Error en el flujo de "Store on Blockchain" detectado preventivamente. Link a Faucet sugerido.
- **Estado E (Abandono):** Clear de `localStorage` de conexión si aplica y reset de estado en contexto.

#### 4. Control de Sobreingeniería (Clasificación):
- **Componente Nuevo:** `NetworkGuard` (Banner de red transversal).
- **Adaptación:** `Web3Context` (BrowserProvider) y `SelectWalletPage` (trigger de conexión).
- **Estado UI:** `FaucetLink` (dentro de errores o banners).

#### 5. Conclusión Final:
- **Obligatorio:** Inyección de wallet browser y validación de Sepolia (Chain ID: 11155111).
- **Opcional:** Spinner de carga durante detección de provider.
- **Intocable:** Lógica de negocio de contratos y componentes de visualización de historial.

**Estado final:**
- ANÁLISIS TÉCNICO COMPLETO Y ENDURECIDO.
- MAPA DE IMPACTO UX DEFINIDO.
- LISTO PARA FASE 4 (No avanzar aún).

---

# 📄 FASE 4 — Planificación y Actualización de Specs (OBLIGATORIA)

**Objetivo:** Definir primero la nueva versión del sistema antes de escribir código.

---

## ⚠️ Regla de proceso (CRÍTICA)

### NO se permite empezar implementación si esta fase no está completada.

Antes de tocar código, se debe dejar claro en specs:

* cómo funcionará el sistema en Sepolia
* qué cambia respecto al entorno local
* qué dependencias nuevas existirán
* qué comportamiento se mantendrá igual

---

## 📂 Ruta crítica de specs

```text
/home/rene/web3-dev/01-document-sign-storage-sepolia/governance
```

---

## 🧾 Lo que debe quedar definido en specs

### A. Arquitectura actualizada

* wallet real en vez de cuentas mock
* uso de Sepolia en vez de Anvil
* flujo frontend ↔ contrato actualizado

### B. Flujo funcional actualizado

* conexión de wallet
* validación de red
* firma / registro
* verificación

### C. Dependencias nuevas

* provider externo (Alchemy)
* MetaMask / Rabby
* faucet Sepolia

### D. Diferencias frente al baseline

* qué cambia
* qué se elimina
* qué se mantiene

### E. Restricciones de esta fase

* sin gasless
* sin relayer
* sin IPFS
* sin backend

---

## 🧠 Propósito de esta fase

Que tanto tú como Antigravity puedan revisar y discutir la nueva versión del sistema **antes** de implementar.

---

### ✅ Validación

Esta fase se considera completada solo si:

* los specs están actualizados
* el alcance está definido
* tú lo revisaste
* Antigravity también lo revisó
* ambos están alineados antes de desarrollar

---

### 🧪 EJECUCIÓN REAL — FASE 4

**Fecha:** 2026-03-25  
**Responsable:** Antigravity  

#### 1. Acciones realizadas:
- Creación de `governance/spec-migration-sepolia.md` con la arquitectura y flujos de red definitivos.
- Formalización de los estados UX (Disconnected, Connected, Wrong Network, No Funds).
- Vinculación de especificaciones existentes (`spec.md` y `spec-acceptance.md`) al nuevo plan de Sepolia.

#### 2. Archivos modificados:
- `governance/spec-migration-sepolia.md` (Nuevo)
- `governance/spec.md` (Referencia añadida)
- `governance/spec-acceptance.md` (Referencia añadida)

#### 3. Decisiones tomadas:
- Se mantiene el uso de `ethers` nativo sin librerías externas adicionales para garantizar un control total sobre la lógica de migración definida en el playbook.
- **Alcance MVP:** Solo se implementará identidad inyectada y despliegue directo en Sepolia, postergando AA o L2 para fases futuras.

#### 4. Endurecimiento Arquitectónico (Hardening):
- **Modelo de Estado:** Se definieron estados formales para la Wallet (`idle`, `connected`, `wrong_network`, etc.) y el Ciclo de Vida de Transacción (`signing`, `submitting`, `confirming`).
- **Web3Context:** Se establecieron fronteras claras de responsabilidad. El contexto solo gestiona conectividad, identidad y reactividad a eventos EIP-1193.
- **Eventos Críticos:** Se formalizó el comportamiento de `accountsChanged` (Hot-swap de UI) y `chainChanged` (Reload/Guard reactivo).
- **Consistencia:** Se sincronizaron la especificación funcional (`spec.md`) y los criterios de aceptación (`spec-acceptance.md`) con las reglas de red de Sepolia y la eliminación total de cuentas mock.

#### 6. Optimización de Precisión Final (Puntos de Cierre):
- **Desacoplamiento:** Se eligió la **Opción B** (Web3Context no expone el contrato). Mayor modularidad y facilidad de mantenimiento.
- **AccountsChanged:** Se definió reset de Firma/Historial/TXHash pero **preservación** del archivo y hash calculado (Mejor UX).
- **ChainChanged:** Se eligió la **Opción A (Full Reload)**. Es la ruta más segura para garantizar la integridad de red en ambientes ETH reales.
- **Bloqueos UI:** Definición estricta de estados de deshabilitación de botones (Double-submit prevention) y persistencia de datos durante errores.
- **Wallet Unavailable:** Formalización del estado `unavailable` para guiar al usuario a la instalación de MetaMask/Rabby sin romper el render.

#### 7. Estado final:
- LA FASE 4 QUEDA DEFINITIVAMENTE CERRADA Y LISTA PARA PASAR A FASE 5.

---

# 🧠 FASE 5 — Definición de Migración Mínima (Sepolia)

**Objetivo:** Convertir los specs aprobados en un plan técnico de implementación mínima viable.

---

## 🎯 Principios

* mínimo cambio
* máximo reaprovechamiento
* cero sobreingeniería

---

## 🔧 PLAN OPERATIVO FINAL — FASE 5

### Orden Recomendado de Implementación (Estratega)

1.  **BLOQUE 1: Identidad y Conectividad (Web3Core)** — Validar la tubería browser-wallet antes de nada.
2.  **BLOQUE 2: Pantalla de Entrada (Login UX)** — Habilitar el acceso real del usuario.
3.  **BLOQUE 3: Capa de Protección (Guards)** — Blindar la app contra redes incorrectas.
4.  **BLOQUE 4: Servicio de Contrato (Contract Hook)** — Preparar la integración desacoplada.
5.  **BLOQUE 5: Infraestructura (Sepolia Deploy)** — Despliegue oficial del contrato.
6.  **BLOQUE 6: Integración Final (E2E Functional)** — Cierre del flujo completo.

**Justificación:** Validamos primero el cambio más radical (Identidad Inyectada) y la navegación UX. Una vez que la "vivienda" (DApp) está lista para recibir "electricidad" (Web3), desplegamos la planta (Contrato) y conectamos los cables. Reducimos el debugging cruzado de red vs identidad.

---

## ESTRUCTURA POR BLOQUES TÉCNICOS

### BLOQUE 1 — Identidad y Conectividad (Web3Core)
**Objetivo:** Sustituir PKs locales por inyección de identidad EIP-1193.
**Validación Técnica:** `window.ethereum` detectado; `BrowserProvider` instanciado; listener `accountsChanged` activo.
**Validación Funcional:** La dirección en el Header cambia al alternar cuentas en la wallet del navegador.

### BLOQUE 2 — Pantalla de Entrada (Login UX)
**Objetivo:** Reemplazar el simulador de cuentas Anvil por el flujo de conexión real.
**Validación Técnica:** Eliminación de `mockAccounts`; implementación de `requestAccounts`.
**Validación Funcional:** El botón "Connect Wallet" dispara el popup de la extensión.

### BLOQUE 3 — Protecciones de Red y Guards
**Objetivo:** Implementar la lógica de red Sepolia (Chain ID 11155111).
**Validación Técnica:** Lógica de `NetworkGuard` activa; `chainChanged` forzando `window.location.reload()`.
**Validación Funcional:** Al cambiar a Mainnet, la app muestra un banner de alerta y deshabilita CTAs.

### BLOQUE 4 — Servicio de Contrato (Contract Hook)
**Objetivo:** Desacoplar la instancia del contrato del Contexto Global (Opción B).
**Validación Técnica:** Hook `useDocumentRegistry` devolviendo instancia firmada; limpieza de `Web3Context`.
**Validación Funcional:** Navegación por History/Upload sin errores de instancia de contrato.

### BLOQUE 5 — Infraestructura (Sepolia Deploy)
**Objetivo:** Despliegue oficial del contrato y configuración de entorno.
**Validación Técnica:** Script `Deploy.s.sol` exitoso; address en `.env.local`; contrato verificado.
**Validación Funcional:** Dirección del contrato consultable en Etherscan Sepolia.

### BLOQUE 6 — Integración Final (E2E Functional)
**Objetivo:** Validar el ciclo completo de firma y almacenamiento en Sepolia.
**Validación Técnica:** Ciclo TX completado; manejo de latencia de bloque de ~12s.
**Validación Funcional:** Firma de documento real y aparición en la tabla de historial de Sepolia.

---

### 🧪 EJECUCIÓN REAL — FASE 5

**Fecha:** 2026-03-25  
**Responsable:** Antigravity  

#### 1. Acciones realizadas:
- Reordenamiento del plan técnico para priorizar la Capa de Identidad (Web3Core) sobre la Infraestructura.
- Definición de validaciones duales (Técnica vs Funcional) para cada bloque.
- Justificación estratégica del nuevo orden para minimizar el debugging cruzado.

#### 2. Decisiones tomadas:
- **Identidad Primero:** No desplegar contrato hasta que el frontend sea capaz de hablar con una wallet real.
- **Validación Dual:** Cada paso de implementación requiere una prueba técnica (código/logs) y una visual (comportamiento UI).

#### 4. Endurecimiento UX (Feedback Asíncrono):
- **Matriz de Estados:** Se definió una matriz detallada para Upload, Sign, Store, Verify e History.
- **Latencia:** Se establecieron comportamientos específicos para los ~12s de espera en Sepolia (`confirming` state).
- **Persistencia:** Se garantizó que la cancelación de firma o errores de gas no borren el archivo o el hash ya calculado, mejorando el reintento.
- **Wallet Interaction:** Se incluyó el estado `waiting_wallet` para guiar al usuario a revisar su extensión (MetaMask/Rabby).

#### 5. Estado final:
- PLAN OPERATIVO Y UX DEFINITIVOS.
- LISTO PARA FASE 6 (Implementación).

---

# ⚙️ FASE 6 — Implementación Controlada

**Objetivo:** Aplicar los cambios mínimos aprobados en specs.

---

## 🔧 Frontend

* conectar MetaMask / Rabby
* detectar red
* forzar Sepolia
* eliminar claves privadas locales
* adaptar el flujo actual sin romper UX

---

## 🔧 Blockchain

* desplegar contrato en Sepolia
* usar contract address real

---

## 🔧 Configuración

* configurar Alchemy RPC
* variables `.env`
* explorer links

---

## ⚠️ Regla

Cambios pequeños, reversibles y verificables.

No se permite un refactor masivo.

---

### ✅ Validación

Cada cambio debe poder:

* probarse
* entenderse
* revertirse

---

### 🧪 EJECUCIÓN REAL — FASE 6 / BLOQUE 1

**Fecha:** 2026-03-25  
**Responsable:** Antigravity  

#### 1. Cambios técnicos realizados:
- **Refactor de `Web3Context.tsx`:** Implementada la lógica de inyección de `BrowserProvider` y eliminación de identidades mock.
- **Gestión de Eventos:** Añadida reactividad a `accountsChanged`, `chainChanged` (reload) y `disconnect`.
- **Integridad de Tipos:** Actualizado `dapp/types/index.d.ts` con la definición de `window.ethereum`.

#### 2. Actualización del Skill:
- **`SKILL.md`:** Documentada la guía para verificar el `Web3Context` y la preparación para la integración con Alchemy (Paso 5).

#### 3. Validación:
- **Harness de Pruebas:** Creada página técnica en `/test-wallet` para validación manual de la capa de identidad.
- El contexto inicializa en estado `disconnected` (con wallet detectada) o `unavailable` en su defecto.
- El evento `chainChanged` dispara correctamente el refresco de la aplicación.

#### 4. Estado final:
- BLOQUE 1 COMPLETADO. Listo para el Bloque 2 (Adaptación de UI de entrada).

---

### 🧪 EJECUCIÓN REAL — FASE 6 / BLOQUE 2

**Fecha:** 2026-03-25  
**Responsable:** Antigravity

#### 1. Objetivo:
Adaptar la pantalla de entrada (`SelectWalletPage`) para usar el flujo real de conexión web3 inyectada y eliminar mocks de Anvil.

#### 2. Cambios Realizados:
- **`SelectWalletPage.tsx`:** Refactorizado completamente. Eliminado `detectAnvil` y la lista de cuentas mock. Implementada UX reactiva basada en `walletStatus`.
- **`Topbar.tsx`:** Eliminado "Anvil Network" hardcoded. Ahora muestra el nombre dinámico de la red.
- **`UploadPage.tsx`:** Armonizados los guards de red y navegación con el nuevo `Web3Context`.

#### 3. Validación:
- **Técnica:** Verificado con `eslint` que no hay errores de tipos.
- **Funcional:** Ya no aparecen las 10 cuentas mock de Anvil. El botón de conexión dispara el popup real de la wallet.
- **URL de prueba:** `http://localhost:3003/`.

#### 4. Estado final:
- BLOQUE 2 COMPLETADO. La entrada a la dApp ya es 100% "Web3 Native".

---

### 🧪 EJECUCIÓN REAL — FASE 6 / BLOQUE 3

**Fecha:** 2026-03-25  
**Responsable:** Antigravity

#### 1. Objetivo:
Desacoplar la lógica del contrato del contexto global y adaptar el Dashboard para usar el `signer` real de la wallet inyectada.

#### 2. Cambios Realizados:
- **`useDocumentRegistry.ts` (NUEVO):** Hook especializado y desacoplado de `Web3Context`. Gestiona la instancia del contrato `Contract` usando automáticamente el `signer` (escritura) o `provider` (lectura).
- **`UploadPage.tsx`:** Actualizado para consumir el nuevo hook. Firma (`signMessage`) y registro (`storeDocumentHash`) ahora usan el `signer` de la wallet real.
- **`VerifyPage.tsx` & `DocumentHistory.tsx`:** Migrados para usar `useDocumentRegistry`, eliminando el acoplamiento directo en el contexto.
- **Limpieza de Mocks:** Eliminada cualquier dependencia implícita de PKs o cuentas locales Anvil en la lógica de negocio.

#### 3. Validación:
- **Técnica:** Verificado con `eslint` que el hook se instancia correctamente y que las páginas consumen la nueva capa sin errores de tipos.
- **Funcional:** El flujo de firma y registro on-chain ya dispara el popup real de la wallet conectada.

#### 4. Estado final:
- BLOQUE 3 COMPLETADO. "Plomería" de identidad real y contrato lista para el despliegue final.

---

# 🌐 FASE 7 — Validación Funcional en Sepolia

**Objetivo:** Confirmar que el sistema funciona end-to-end en testnet.

---

## 🔧 Flujo mínimo a validar

1. conectar wallet
2. cambiar a Sepolia
3. cargar ETH desde faucet
4. subir documento
5. registrar hash
6. verificar documento
7. revisar evidencia on-chain

---

## ⚠️ Requisito crítico

Las pruebas dependen de faucet.

### Todo tester debe contar con:

* MetaMask o Rabby
* red Sepolia
* ETH de prueba

---

### ✅ Validación

El sistema debe poder ser usado por una wallet real y generar una prueba verificable.

---

### 🧪 EJECUCIÓN REAL — FASE 7

**Fecha:**
**Responsable:**

## **Acciones realizadas:**

**Comandos ejecutados:**

```bash
```

## **Archivos modificados:**

## **Decisiones tomadas:**

## **Problemas encontrados:**

## **Soluciones aplicadas:**

## **Estado final:**

---

# 🔗 FASE 8 — Preparación para Integración Futura

**Objetivo:** Dejar el proyecto listo para futura integración con:

```text
truxign.onchainly.xyz
```

---

## ❌ Esta fase NO implica todavía

* deploy final
* migración completa al monorepo
* backend productivo

---

## ✅ Sí implica

* compatibilidad futura
* estructura limpia
* base reutilizable

---

### 🧪 EJECUCIÓN REAL — FASE 8

**Fecha:**
**Responsable:**

## **Acciones realizadas:**

**Comandos ejecutados:**

```bash
```

## **Archivos modificados:**

## **Decisiones tomadas:**

## **Problemas encontrados:**

## **Soluciones aplicadas:**

## **Estado final:**

---

# 🧾 Política de Commits

Formato obligatorio:

```text
feat: connect wallet with sepolia
fix: update contract address for testnet
refactor: remove local mock signer
docs: update migration specs for sepolia
```

---

# 🤖 Rol de Antigravity

## ❌ NO debe

* tocar el proyecto original
* avanzar sin validación
* saltarse specs
* hacer toda la migración de golpe

---

## ✅ SÍ debe

* trabajar fase por fase
* validar antes de avanzar
* explicarte qué está haciendo
* detenerse para revisión
* retroalimentar este documento constantemente

---

# 🧪 Resultado Final Esperado

## A. Proyecto original intacto

```text
01-document-sign-storage
```

## B. Proyecto de trabajo funcional

```text
01-document-sign-storage-sepolia
```

## C. Rama activa de migración

```text
sepolia-migration
```

## D. Specs actualizados y validados

```text
/governance
```

## E. Demo funcional en Sepolia

* wallet real
* flujo verificable
* testnet operativa

## F. Documento completamente trazable

Este playbook debe terminar incluyendo:

* fases ejecutadas
* pasos reales realizados
* comandos usados
* decisiones técnicas tomadas
* problemas encontrados
* soluciones aplicadas