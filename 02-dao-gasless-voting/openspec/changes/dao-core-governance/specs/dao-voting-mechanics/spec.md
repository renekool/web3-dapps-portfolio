## ADDED Requirements

### Requirement: Ponderación Unitaria e Historial Reversible
Todo participante ostenta autonomía individualizada. A los votos se les habilita "arrepentimiento temporal" siempre y cuando su modificación sea antes de la expiración `deadline`.

#### Scenario: Emisión Primeriza del Voto
- **WHEN** un individuo invoca el derecho al sufragio `vote()` mediante postura ("Favor", "Contra", "Abstención") sobre una ID válida.
- **THEN** su dirección consolida la postura en memoria y un registro estático de su peso depositado (`weightVoted`) de ese momento exacto, sin afectar su habilitación de revertirla.

#### Scenario: Restructuración del Voto Previo (Arrepentimiento Matemático)
- **WHEN** el mismo identificador asienta un tipo de elección dispar al de su historial inicial mientras el estado de la propuesta es `Active` (antes del `deadline`).
- **THEN** se substrae estrictamente la participación de peso con la que votó originalmente (usando el `weightVoted` pasado) y se pondera a la nueva alternativa seleccionada sumando su balance actual. Luego, se actualiza su `weightVoted` histórico a su balance nuevo, blindando la contabilidad del total de votos frente a múltiples depósitos post-voto.

#### Scenario: Intento de Doble Voto Redundante
- **WHEN** el usuario ya tiene un recibo de voto y vuelve a votar exactamente la misma alternativa (`VoteType`).
- **THEN** la operación debe revertir de inmediato ("Already voted that option") para evitar consumo inútil de gas y lógica redundante.

#### Scenario: Intento de Votación fuera de Deadline o Estado Inválido
- **WHEN** un miembro trata de añadir, emitir o cambiar un voto en una propuesta cuyo estado no es `Active` o que ya ha superado su timestamp `deadline`.
- **THEN** la transacción se bloquea revirtiendo incondicionalmente.

### Requirement: Feedback de Interfaz y Control de Estado (UX)
La interfaz de usuario DEBE sincronizar el estado del voto del usuario conectado para prevenir errores y mejorar la transparencia.

#### Scenario: Visualización de Voto Registrado
- **GIVEN** un usuario autenticado que ya ha emitido un voto en una propuesta activa.
- **WHEN** la interfaz visualiza el detalle de la propuesta.
- **THEN** la opción seleccionada DEBE estar resaltada visualmente y su botón de acción DEBE estar deshabilitado para prevenir transacciones redundantes.

#### Scenario: Cambio de Voto (Enmendadura) en UI
- **GIVEN** un usuario que desea cambiar su postura.
- **WHEN** las otras opciones de voto (distintas a la actual) están habilitadas.
- **THEN** al hacer clic en una nueva opción, la interfaz DEBE notificar que se trata de un cambio de postura antes de proceder con el envío.
