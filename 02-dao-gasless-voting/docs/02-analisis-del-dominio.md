# 02 • Análisis del Dominio

## 2.1 Actores del Sistema
El sistema DAO involucra varios actores que interactúan con los contratos inteligentes y la interfaz web.

### Miembro del DAO
Es cualquier usuario que ha depositado fondos en la tesorería del sistema.

**Responsabilidades:**
- Depositar fondos en el DAO
- Participar en votaciones
- Consultar el estado de propuestas
- Firmar transacciones o meta-transacciones

**Capacidades:**
- Posee poder de voto proporcional a su depósito.
- Puede votar **A Favor**, **En Contra** o **Abstención**.

### Proponente
Es un miembro del DAO que cumple el requisito mínimo para crear propuestas.

**Requisitos:**
- Poseer al menos **1% del balance total del DAO**.

**Responsabilidades:**
- Crear propuestas de gasto
- Definir:
  - Dirección beneficiaria
  - Cantidad solicitada
  - Duración de votación

**Restricciones:**
- Máximo **3 propuestas activas simultáneamente**.

### Relayer
Es un servicio backend encargado de enviar transacciones a la blockchain en nombre de los usuarios.

**Responsabilidades:**
- Recibir meta-transacciones firmadas
- Validar formato y firma
- Enviar transacciones al contrato forwarder
- Pagar el gas de ejecución

**Limitaciones:**
- No puede modificar el contenido firmado por el usuario.

### Daemon de Ejecución
Es un proceso en segundo plano automatizado que monitorea el estado del sistema.

**Responsabilidades:**
- Verificar periódicamente (cron/trigger) las propuestas cuyo periodo de votación (`deadline`) y periodo de seguridad (`timelock`) han vencido.
- Ejecutar transacciones automáticamente para aquellas propuestas que cumplen los requisitos de aprobación (quórum y mayoría).

### Sistema DAO (Smart Contracts)
Es el conjunto de contratos inteligentes que gobiernan el sistema (`DAOVoting` y `MinimalForwarder`).

**Responsabilidades:**
- Gestionar la tesorería
- Registrar depósitos
- Gestionar propuestas
- Registrar votos
- Ejecutar propuestas aprobadas

Garantiza las invariantes definidas en la sección anterior.

---

## 2.2 Casos de Uso (Use Case List)
A continuación se presentan los casos de uso principales del sistema.

### Conectar Wallet
**Actor:** Usuario
**Flujo:**
1. El usuario abre la aplicación web.
2. La aplicación solicita conexión con MetaMask.
3. El usuario autoriza la conexión.
**Resultado:**
- La dirección del usuario queda conectada al sistema.

### Depositar Fondos En El DAO
**Actor:** Usuario
**Flujo:**
1. El usuario introduce una cantidad de ETH.
2. Firma la transacción.
3. El contrato recibe los fondos.
**Resultado:**
- El balance del usuario se registra dentro del DAO.
- Aumenta la tesorería total.

### Crear Propuesta
**Actor:** Proponente
**Flujo:**
1. El usuario define:
   - Dirección beneficiaria
   - Cantidad solicitada
   - Duración de votación
2. El sistema valida las reglas del DAO.
3. Se registra una nueva propuesta.
**Resultado:**
- La propuesta entra en estado **Activa**.

### Votar Propuesta
**Actor:** Miembro del DAO
**Flujo:**
1. El usuario selecciona una propuesta activa.
2. Elige un tipo de voto:
   - A Favor
   - En Contra
   - Abstención
3. Firma la meta-transacción.
**Resultado:**
- El voto queda registrado en el contrato.

### Ejecutar Propuesta Aprobada
**Actor:** Daemon de Ejecución / Miembro del DAO
**Flujo:**
1. Finaliza el periodo de votación.
2. Se verifica:
   - Quorum mínimo
   - Mayoría requerida
3. Se inicia el timelock.
4. Tras el timelock se ejecuta la transferencia.
**Resultado:**
- Los fondos se envían al beneficiario.

---

## 2.3 Diagrama de Flujo Funcional (Versión Actual)

*(Se asume un flujo sin meta-transacciones)*
```text
User                      Frontend                       RPC                        DAOContract
 │                           │                            │                              │
 ├───Conectar Wallet────────▶│                            │                              │
 │                           │                            │                              │
 ├───Depositar ETH──────────▶│                            │                              │
 │                           ├───Enviar transacción──────▶│                              │
 │                           │                            ├───Ejecutar deposit()────────▶│
 │                           │                            │◀──────Confirmación───────────┤
 │                           │◀──Balance actualizado──────┤                              │
 │                           │                            │                              │
 ├───Crear Propuesta────────▶│                            │                              │
 │                           ├───createProposal()────────▶│                              │
 │                           │                            ├───Registrar propuesta───────▶│
 │                           │                            │                              │
 ├───Votar propuesta────────▶│                            │                              │
 │                           ├───vote()──────────────────▶│                              │
 │                           │                            ├───Registrar voto────────────▶│
 │                           │                            │◀──Resultado votación─────────┤
 │                           │◀──Estado actualizado───────┤                              │
 │                           │                            │                              │
 ▼                           ▼                            ▼                              ▼
User                      Frontend                       RPC                        DAOContract
```

## Flujo de Meta-Transacciones (EIP-712 + EIP-2771)

```text
User                      Frontend            Relayer           Forwarder          DAOContract           RPC
 │                           │                   │                  │                   │                 │
 ├─Action (Vote / Create)───▶│                   │                  │                   │                 │
 │                           │                   │                  │                   │                 │
 │◀─Request Signature────────┤                   │                  │                   │                 │
 │                           │                   │                  │                   │                 │
 ├─Signed Message───────────▶│                   │                  │                   │                 │
 │                           ├─Send MetaTx──────▶│                  │                   │                 │
 │                           │                   ├─Send Transaction──────────────────────────────────────▶│
 │                           │                   │                  │                   │                 │
 │                           │                   │◀─execute(req,sig)──────────────────────────────────────┤
 │                           │                   │                  ├─Forward Call─────▶│                 │
 │                           │                   │                  │◀─Execution Result─┤                 │
 │                           │                   │                  │                   │                 │
 │                           │                   │◀─────────────────────────Transaction Success───────────┤
 │                           │                   │                  │                   │                 │
 │                           │                   │◀──────────────────────Tx Hash──────────────────────────┤
 │                           │                   │                  │                   │                 │
 │                           │◀──Confirmation────┤                  │                   │                 │
 │                           │                   │                  │                   │                 │
 │◀──Action Completed────────┤                   │                  │                   │                 │
 │                           │                   │                  │                   │                 │
 ▼                           ▼                   ▼                  ▼                   ▼                 ▼
User                      Frontend            Relayer           Forwarder          DAOContract           RPC

```

## 2.4 Modelo Conceptual del Dominio

El sistema puede representarse mediante las siguientes entidades principales.

### DAO
Representa la organización descentralizada.
**Atributos:**
- Balance total (`treasuryBalance`)
- Miembros (`totalMembers`)
- Propuestas activas

### Miembro
Usuario que posee fondos depositados en el DAO.
**Atributos:**
- Dirección (`address`)
- Balance depositado (`depositedBalance`)
- Poder de voto

### Propuesta
Solicitud para transferir fondos desde la tesorería.
**Atributos:**
- ID (`id`)
- Proponente (`proposer`)
- Beneficiario (`recipient`)
- Monto solicitado (`amount`)
- Deadline (`deadline`)
- Estado (`status`)

**Estados posibles:**
- Activa
- Aprobada
- Rechazada
- Ejecutada

### Voto
Registro de la decisión de un miembro.
**Atributos:**
- Propuesta asociada
- Dirección del votante (`voter`)
- Tipo de voto (`voteType`)

**Tipos de voto:**
- A Favor
- En Contra
- Abstención

### Tesorería
Contrato que mantiene los fondos del DAO.
**Funciones:**
- Recibir depósitos
- Transferir fondos tras aprobación de propuestas
