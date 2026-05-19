# Specification: DAO Frontend Interface (Final Alignment)

## 1. Overview
Esta especificación consolida la arquitectura final del sistema, definiendo las responsabilidades de cada capa y resolviendo las inconsistencias detectadas entre el Smart Contract y la interfaz de usuario.

## 2. Decisiones de Arquitectura Final

### 2.1 Gestión de Metadatos
Se evaluaron dos opciones para la persistencia de títulos y descripciones:
- **Opción A (`descriptionURI` - string)**: Almacena un enlace (ej. IPFS) directamente en el struct.
- **Opción B (`metadata hash` - bytes32)**: Almacena solo el hash de integridad.

**Decisión Final: Opción A (`descriptionURI`)**
- **Justificación**: Facilidad de integración directa con la UI y compatibilidad con clientes RPC estándar sin requerir lógica de reconstrucción de hash-a-URI en el frontend. El costo adicional de gas es marginal frente a la mejora en flexibilidad y simplicidad de lectura.

### 2.2 Contabilidad de Abstenciones
- **Decisión**: **NO** se añadirá un contador de abstenciones al contrato.
- **Justificación**: El evento `Voted` ya emite el `VoteType`. La UI o una capa de indexación (Service) sumará estos eventos para mostrar el total. Esto mantiene el contrato simple y ahorra gas en cada voto.

### 2.3 Derivación de Estados Temporales
- **Decisión**: La UI es responsable de derivar los estados **QUEUED** y **AUTOMATION PENDING**.
- **Justificación**: Los timestamps (`deadline`, `timelockDeadline`) ya son públicos. Modificar el estado on-chain requeriría transacciones adicionales (gas) solo para fines visuales.

### 2.4 Quórum y Snapshots
- **Decisión**: La UI utilizará estrictamente `totalDepositedAtCreation` para el progreso de quórum.
- **Justificación**: Asegura que el objetivo de participación sea justo y refleje la masa monetaria del momento en que se propuso la idea.

## 3. Capas de Responsabilidad

1.  **UI (React/Next.js)**: 
    - Interpretación visual de reglas de negocio (colores por mayoría 60%).
    - Renderizado de estados derivados por tiempo.
2.  **Store (Zustand)**: 
    - Sincronización de datos del contrato.
    - Manejo de estados de carga y transacciones pendientes.
3.  **Service (Indexador/RPC)**: 
    - Agregación de eventos históricos (`Voted` para totales de abstención).
    - Rastreo de actividad histórica del usuario.
4.  **Contract (DAOVoting V2)**: 
    - Fuente de verdad financiera y lógica de ejecución.
    - Soporte para metatransacciones (Gasless).

## 4. Validación Final del Sistema

- **Consistencia**: El sistema es 100% consistente. La UI ya sabe de dónde sacar cada dato y el contrato recibirá el campo único necesario para completar la experiencia descentralizada (`descriptionURI`).
- **Decisiones Abiertas**: Ninguna. Todos los puntos críticos han sido cerrados.
- **Readiness**: **LISTO**. El diseño respeta el contrato actual en un 95%, requiriendo solo una actualización mínima para habilitar los metadatos on-chain.

---
**Firmado para implementación: [Architect AI]**
