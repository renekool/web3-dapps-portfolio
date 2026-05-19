# Especificación de Mecánicas de Votación y Gobernanza

## 🧪 Lógica de Decisión (Cálculos de Contrato)

El sistema de gobernanza se rige por reglas estrictas de mayoría cualificada y quórum mínimo, alineadas directamente con la lógica del contrato `DAOVoting.sol`.

### Requirement: Determinación del Estado de Votación (PASSING/FAILING)
El estado de una propuesta activa se calcula dinámicamente comparando la participación actual contra los retos criptoeconómicos del DAO.

#### Scenario: Cálculo de Quórum (Barrera del 30%)
- **GIVEN** una propuesta creada con una captura del tesoro total (`totalDepositedAtCreation`).
- **WHEN** se evalúa el quórum alcanzado.
- **THEN** se suma estrictamente `For` + `Against`. Los votos de `Abstain` **NO** cuentan para el quórum.
- **AND** el resultado debe ser `>= 30%` del tesoro capturado al momento de crear la propuesta.

#### Scenario: Cálculo de Mayoría Cualificada (Super-Majority 60%)
- **WHEN** se evalúa si la propuesta tiene apoyo suficiente para pasar.
- **THEN** se calcula el ratio de soporte como `For / (For + Against)`.
- **AND** el voto `For` debe ser estrictamente `> 60%` del total de votos de decisión. Los votos de `Abstain` son ignorados en este cálculo.

---

## 🎨 Interfaz de Usuario e Indicadores Visuales

### Requirement: Visualización de Precisión y Transparencia
Toda la información numérica debe presentarse de forma que no induzca a error al votante sobre el estado real de la gobernanza.

#### Scenario: Formato Numérico Consistente
- **THEN** todos los porcentajes (Quórum, For, Against, Abstain) se muestran con **2 decimales fijos** (ej: `21.00%`).
- **AND** las cantidades físicas de votos (ETH) se muestran con hasta 2 decimales (ej: `0.30 votes`).

#### Scenario: Grid de Propuestas (VOTING STATUS)
- **THEN** la lista principal de propuestas incluye una columna dedicada `VOTING` que muestra el estado `PASSING` o `FAILING` en tiempo real.
- **AND** el ancho de las columnas está balanceado para priorizar la legibilidad del título de la propuesta y su estado de votación.

#### Scenario: Diseño de Badges de Estado
- **THEN** los indicadores de estado (`ACTIVE`, `PASSING`, `FAILING`, `EXECUTED`) son de tipo "pill/badge" con colores semánticos.
- **AND** se eliminan todos los íconos (checks, cruces) para mantener una estética limpia y centrada en el texto.

---

## 🔄 Flujo de Transacción Sincronizado

### Requirement: Persistencia de Feedback en Votación
El usuario no debe perder el contexto de su acción hasta que la blockchain confirme el cambio de estado.

#### Scenario: Ciclo de Vida de la Votación
1. **Selección**: El usuario elige una de las tres "Voting Cards" (selección única).
2. **Confirmación**: Se invoca MetaMask. El modal "Processing Vote" aparece **después** de que el usuario confirma en la wallet.
3. **Espera (Pending)**: El modal permanece visible mientras la transacción está en estado `pending`.
4. **Sincronización (Confirmed)**: Una vez confirmada en blockchain, el sistema espera a que el store local (Reflejado en la UI) se actualice con la nueva postura.
5. **Cierre**: Solo cuando la card de votación muestra el estado "Voted", el modal de procesamiento se cierra automáticamente.
