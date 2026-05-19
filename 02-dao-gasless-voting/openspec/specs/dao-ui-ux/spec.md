# Specification: DAO UI/UX Interaction Rules

## 1. Overview
Esta especificación define las reglas de comportamiento y consistencia visual de la interfaz del DAO, asegurando que la experiencia del usuario sea fluida, predecible y sincronizada con el estado de la blockchain.

## 2. Gestión de Sesión y Wallet
Cualquier cambio en la dirección de la wallet activa (`Account Change` en MetaMask/Extensiones) debe disparar un reset completo del estado interactivo del dashboard para prevenir la visualización de datos "stale" (caducados).

### Reglas de Reset al Cambiar Wallet:
- **Toggle "Show My Proposals"**: Debe volver a `OFF`.
- **Búsqueda**: Se limpia el campo `searchQuery`.
- **Filtros y Ordenamiento**: Regresan a sus valores por defecto (`All Proposals` / `Descending`).
- **Paginación**: Reinicia a la `Página 1`.
- **Modales/Dropdowns**: Cualquier menú o modal abierto se cierra automáticamente.

## 3. Control de Segmento ("All / Mine / Others")
El interruptor de visualización ahora es un control de segmento triple que permite una navegación más granular entre el contenido global y el personal.

### Reglas de Negocio del Control:
- **Estados disponibles**:
  1. **All**: Muestra todas las propuestas sin filtros de propiedad.
  2. **Mine**: Solo muestra actividad del usuario (creadas por él o donde ha votado).
  3. **Others**: Solo muestra propuestas de terceros donde el usuario NO ha participado aún.
- **Diseño y Animación**: El control debe presentarse como un "Pill" deslizante sobre un fondo gris claro, con transiciones generadas por `layoutId` de Framer Motion para una sensación táctil y fluida.
- **Persistencia de Página**: Al cambiar entre segmentos, la tabla debe regresar siempre a la `Página 1`.
- **Interacción con Creación**: Al crear una propuesta, si el usuario está en el segmento `Mine` o `All`, la propuesta debe aparecer de inmediato.

## 4. Estados Vacíos (Empty States)
La interfaz debe informar claramente por qué no hay resultados en la tabla.

### Escenarios de Empty State:
1.  **Sin Propuestas en el DAO**:
    - **Título**: "No proposals found"
    - **Texto**: "There are no active proposals right now."
2.  **Toggle "My Proposals" Activado (Sin resultados)**:
    - **Título**: "No proposals yet"
    - **Texto**: "You haven't created any proposals yet."
    - **Acción**: Botón "Create New Proposal" visible para incentivar la participación.
3.  **Filtro de Búsqueda (Sin resultados)**:
    - **Texto**: "Try adjusting your search query."

## 5. Alineación y Jerarquía Visual
Para mantener un orden profesional basado en principios eco-minimalistas:
- Los controles secundarios (como el Toggle) deben alinearse con la línea base de los subtítulos de sección para mantener una jerarquía clara.
- Los elementos interactivos deben usar el sistema de colores `sage green` para estados activos y transiciones suaves de `0.2s`.

## 6. Gestión de Tiempo y Coherencia de Ejecución
Para garantizar que el usuario nunca intente acciones destinadas al fracaso (reverts) y entienda el flujo de seguridad de la DAO:

### Reglas de Sincronización Temporal:
- **Reloj Híbrido**: La dApp debe implementar un motor de tiempo que sume segundos locales al último timestamp sincronizado de la blockchain (`blockchainTime` + `offset`). Esto asegura que los contadores sean fluidos incluso en redes locales (Anvil) donde la blockchain está estática.
- **Heartbeat de Sincronización**: Se debe realizar un polling cada `2 segundos` al bloque `latest`. El punto de referencia de sincronización (`lastSyncTime`) solo se actualiza si el timestamp de la blockchain ha cambiado realmente, previniendo "saltos" hacia atrás en los contadores.

### Coherencia del Botón de Ejecución:
- **Visibilidad del Timelock**: Si una propuesta ha terminado su votación y es exitosa (cumple quórum y mayoría), el botón debe mostrar una cuenta atrás dinámica: `Timelock: 45s`, `Timelock: 44s`...
- **Coerción de Fracaso**: Si la propuesta ha terminado pero NO ha cumplido los requisitos de gobierno, el botón debe cambiar permanentemente a **"Proposal Failed"** y deshabilitarse. Queda estrictamente prohibido mostrar "Timelock Active" en propuestas que han fracasado.
- **Auto-Habilitación**: Al llegar el contador de Timelock a cero, el botón debe transicionar visualmente a **"Execute Proposal"** (verde oscuro) de forma automática sin requerir refresco de página.

---
**Firmado para implementación: [Architect AI]**
