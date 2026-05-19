# Arquitectura de Referencia — Proyecto Web3 Document Sign & Storage

Este documento técnico describe la arquitectura, stack tecnológico, decisiones de diseño y mejores prácticas que han permitido construir con éxito el sistema de registro y verificación de documentos en la blockchain de Ethereum.

Sirve como una guía maestra para el desarrollo de proyectos descentralizados similares.

---

## 1. Arquitectura General del Sistema

El sistema se basa en una arquitectura de capas bien diferenciadas que separan la lógica de negocio, la interacción con la blockchain y la interfaz de usuario.

### Capas del Sistema:

1.  **Capa de Gobernanza y Negocio (`/governance`)**: Define las reglas del sistema (Specs), los invariantes de dominio y la matriz de trazabilidad. Es la fuente de la verdad antes de escribir código.
2.  **Capa de Contratos Inteligentes (`/contract`)**: Lógica on-chain inmutable. Responsable de la persistencia de hashes, timestamps y firmas. Desarrollada con Foundry.
3.  **Capa de Interacción Web3 (`/dapp/services` y `/dapp/hooks`)**: Abstracción que maneja la conexión con proveedores RPC (Ethers.js), gestión de wallets y llamadas a funciones del contrato.
4.  **Capa de Frontend (`/dapp/app` y `/dapp/components`)**: Interfaz de usuario moderna y reactiva construida con Next.js 14 (App Router) y Tailwind CSS.
5.  **Capa de Inteligencia y Skills del Agente (`/.agent`)**: Automatización de flujos críticos como seguridad en Solidity, auditoría de calidad web y gestión de despliegues en entornos complejos (WSL).

---

## 2. Stack Tecnológico

| Componente | Tecnología | Versión / Detalle |
| :--- | :--- | :--- |
| **Framework Frontend** | Next.js | 14.2.3 (App Router) |
| **Lógica de UI** | React | ^18.3.1 |
| **Lenguaje** | TypeScript | ^5.x |
| **Estilos** | Tailwind CSS | ^3.4.3 |
| **Librería Web3** | Ethers.js | ^6.16.0 |
| **Smart Contracts** | Solidity | ^0.8.20 |
| **Framework Desarrollo Smart Contracts** | Foundry | Forge, Anvil, Cast |
| **Iconografía** | Lucide React | ^0.577.0 |
| **Pruebas de Propiedad (PBT)** | fast-check | ^4.6.0 |
| **Entorno de Red Local** | Anvil | Puerto 8546 (WSL Optimized) |
| **Navegador de Desarrollo** | Google Chrome (WSL) | Soporte para Chrome DevTools |

---

## 3. Estructura del Repositorio

La organización de carpetas sigue un patrón modular que facilita el mantenimiento y la escalabilidad:

```text
/
├── .agent/              # Skills y flujos de trabajo del asistente AI
├── contract/            # Proyecto Foundry
│   ├── src/             # Contratos (.sol)
│   ├── test/            # Pruebas unitarias y de integración (Forge)
│   └── script/          # Scripts de despliegue (Solidity)
├── dapp/                # Proyecto Next.js
│   ├── app/             # Páginas y ruteo
│   ├── components/      # UI Atoms, Molecules y Organisms
│   ├── services/        # Lógica de conexión Web3
│   ├── hooks/           # Ganchos personalizados para estado de Wallet y Contrato
│   └── utils/           # Ayudantes (hashing local, formateo)
└── governance/          # Documentación técnica y reglas de negocio (Specs, Invariants)
```

---

## 4. Orden de Construcción Recomendado

Para garantizar la calidad y evitar retrabajo, se recomienda el siguiente orden siguiendo una metodología **Specification-Driven Development**:

1.  **Fase de Gobernanza**: Definir `spec.md` (Requerimientos funcionales en formato EARS) y `invariants.md`.
2.  **Desarrollo del Contrato**: Implementar el smart contract en Solidity basándose estrictamente en los invariantes definidos.
3.  **Garantía de Calidad On-chain**: Escribir y ejecutar tests unitarios con Forge. Realizar auditoría de seguridad preventiva.
4.  **Configuración del Entorno Local**: Levantar la red local (Anvil) y desplegar el contrato. Obtener ABI y dirección.
5.  **Andamiaje del Frontend**: Crear el proyecto Next.js y configurar variables de entorno (`RPC_URL`, `CONTRACT_ADDRESS`).
6.  **Capa de Servicios Web3**: Implementar los hooks de conexión (`useWeb3`) y de interacción con el contrato (`useContract`).
7.  **Desarrollo de Funcionalidades**:
    - **Upload**: Hashing local -> Firma -> Transacción on-chain.
    - **Verify**: Recuperación data -> Comparación off-chain.
    - **History**: Enumeración de hashes registrados.
8.  **Pulido de UI/UX**: Aplicar estilos consistentes, animaciones suaves y manejo de errores (Toasts).
9.  **Validación Final**: Ejecución de auditoría de calidad web (Performance, Accesibilidad).

---

## 5. Mejores Prácticas y Decisiones de Arquitectura

### Desarrollo de Smart Contracts
- **Patrón Checks-Effects-Interactions**: Siempre validar entradas y estado primero, luego actualizar estado, y finalmente emitir eventos o interactuar con otros contratos.
- **Hashing Off-chain**: No enviar archivos a la blockchain. Calcular el hash `keccak256` en el navegador para ahorrar gas y mantener la privacidad.
- **Enumerabilidad**: Utilizar un `Array` de hashes junto con un `Mapping` para permitir la recuperación de la lista completa de documentos registrados.

### Desarrollo de Frontend (DApp)
- **Separación de Lógica Web3**: No mezclar lógica de Ethers.js dentro de los componentes visuales. Usar **Services** o **Hooks** dedicados.
- **Persistencia de Contexto**: El estado del firmante (`signer`) debe estar disponible globalmente para evitar peticiones repetitivas a la wallet.
- **Manejo Proactivo de Errores**: Capturar rechazos del usuario en la firma (`4001`) y problemas de red RPC antes de que lleguen a la consola.

### Calidad y Gobernanza
- **Matriz de Trazabilidad**: Mantener un vínculo claro entre cada Requerimiento Funcional (RF) y su implementación en el código.
- **Property-Based Testing (PBT)**: Usar `fast-check` para validar casos de borde en la generación de hashes y formateo de datos que los tests unitarios tradicionales podrían omitir.
- **Pruebas en Entorno Nativo (WSL)**: Cuando el servidor corre en WSL, las pruebas de UI y las interacciones automatizadas del agente deben realizarse en la instancia de Google Chrome instalada dentro de WSL para garantizar la compatibilidad con **Chrome DevTools** y evitar problemas de resolución de red.

---

## 6. Requisitos de Entorno y Configuración

### Prerrequisitos
- **Node.js**: >= 18.x
- **Foundry**: Instalado vía `foundryup`
- **Wallet**: MetaMask con red configurada a Localhost (Port 8546)
- **Navegador**: Google Chrome instalado en WSL (obligatorio para interacción automatizada del agente)

### Pasos de Instalación
1.  **Clonar y Dependencias**:
    ```bash
    npm install  # En /dapp
    forge install # En /contract
    ```
2.  **Red Local (Anvil)**:
    ```bash
    anvil --host 0.0.0.0 --port 8546
    ```
3.  **Despliegue**:
    ```bash
    # En /contract
    forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8546 --broadcast
    ```
4.  **Frontend**:
    ```bash
    # En /dapp (configurar .env.local primero)
    npm run dev
    ```

---

## 7. Lecciones Aprendidas y Errores Evitados

- **Conflicto de Puertos en WSL**: Se cambió el puerto predeterminado de Anvil de 8545 a **8546** y se bindeó a `0.0.0.0` para resolver problemas de conectividad inter-sistema entre Windows y WSL2.
- **Interoperabilidad de Navegadores**: Se identificó que el uso de navegadores del host (Windows) para probar servidores en WSL puede causar fallos de conexión. La arquitectura de referencia exige el uso de Chrome en WSL para asegurar el acceso a las **Chrome DevTools**, permitiendo que los agentes de IA interactúen correctamente con la interfaz.
- **Carga de Archivos Pesados**: La decisión de calcular el hash localmente utiliza la capacidad del cliente, evitando timeouts en el servidor o costos excesivos de almacenamiento en red.
- **Visibilidad del Estado**: Implementar un "Historial de Documentos" independiente del flujo de subida mejora significativamente la experiencia del usuario al confirmar que su acción tuvo un efecto permanente.

---

Este documento es una guía viva. Para futuros proyectos, úselo como base para el diseño inicial antes de comenzar la implementación.
