# Traceability Matrix — ETH Document Registry

Este documento establece la relación completa entre:

- Requerimientos Funcionales (RF)
- Criterios de Aceptación (AC)
- Historias de Usuario (US)
- Tareas Técnicas (TS)
- Tests Automatizados (TST)
- Commits (CM)
- Pull Requests (PR)

---

## 1. Convenciones

RF-XX   → Functional Requirement  
AC-XX.Y → Acceptance Criteria  
US-XX   → User Story  
TS-XX   → Technical Task  
TST-XX  → Automated Test  
CM-XX   → Commit  
PR-XX   → Pull Request  

---

## 2. Matriz de Trazabilidad

### 🔵 Capa On-Chain (Smart Contract)

| RF | AC | Capa | Sprint | Test Foundry | Commit | PR |
|----|----|------|--------|-------------|--------|----|
| RF-05 | AC-05.1, AC-05.2 | On-chain | S1 | TST-SC-01 (testStoreDocumentHash) | CM-SC-01 | PR-S1 |
| RF-06 | AC-06.1 | On-chain | S1 | TST-SC-02 (testRevertStoreDuplicateDocument) | CM-SC-02 | PR-S1 |
| RF-08 | AC-08.2, AC-08.3, AC-08.4 | On-chain | S1 | TST-SC-03 (testVerifyDocument*) | CM-SC-03 | PR-S1 |
| RF-11 | AC-11.1 (parcial) | On-chain | S1 | TST-SC-04 (testGetDocumentSignature) | CM-SC-04 | PR-S1 |
| RF-20 | AC-20.1 | On-chain | S1 | TST-SC-05 (testRevertStoreInvalidHash) | CM-SC-01 | PR-S1 |
| RF-21 | AC-21.1 | On-chain | S1 | TST-SC-06 (testRevertStoreEmptySignature) | CM-SC-01 | PR-S1 |

---

### 🟢 Capa Off-Chain (Frontend)

| RF | AC | Capa | Sprint | Test | Commit | PR |
|----|----|------|--------|------|--------|----|
| RF-01 | AC-01.1, AC-01.2 | Off-chain | S1 | TST-FE-01 | CM-FE-01 | PR-S2 |
| RF-02 | AC-02.1 | Off-chain | S2 | TST-FE-02 | CM-FE-02 | PR-S2 |
| RF-03 | AC-03.1 | Off-chain | S2 | TST-FE-03 | CM-FE-03 | PR-S2 |
| RF-07 | AC-07.1 | Off-chain | S2 | TST-FE-04 | CM-FE-04 | PR-S2 |
| RF-08 | AC-08.1–AC-08.4 | Off-chain | S2 | TST-FE-05 | CM-FE-05 | PR-S2 |
| RF-09 | AC-09.1 | Off-chain | S2 | TST-FE-06 | CM-FE-06 | PR-S2 |
| RF-10 | AC-10.1 | Off-chain | S2 | TST-FE-07 | CM-FE-07 | PR-S2 |
| RF-11 | AC-11.1 | Off-chain | S2 | TST-FE-08 | CM-FE-08 | PR-S2 |
| RF-12 | AC-12.1 | Off-chain | S2 | TST-FE-09 | CM-FE-09 | PR-S2 |
| RF-13 | AC-13.1, AC-13.2 | Off-chain | S2 | TST-FE-10 | CM-FE-10 | PR-S2 |
| RF-14 | AC-14.1 | Off-chain | S2 | TST-FE-11 | CM-FE-11 | PR-S2 |
| RF-15 | AC-15.1 | Off-chain | S2 | TST-FE-12 | CM-FE-12 | PR-S2 |
| RF-16 | AC-16.1 | Off-chain | S2 | TST-FE-13 | CM-FE-13 | PR-S2 |
| RF-17 | AC-17.1 | Off-chain | S2 | TST-FE-14 | CM-FE-14 | PR-S2 |
| RF-18 | AC-18.1 | Off-chain | S2 | TST-FE-15 | CM-FE-15 | PR-S2 |
| RF-19 | AC-19.1 | Off-chain | S2 | TST-FE-16 | CM-FE-16 | PR-S2 |
| RF-20 | AC-20.1 | Off-chain | S2 | TST-FE-17 | CM-FE-17 | PR-S2 |
| RF-21 | AC-21.1 | Off-chain | S2 | TST-FE-18 | CM-FE-18 | PR-S2 |
| RF-22 | AC-22.1 | Off-chain | S2 | TST-FE-19 | CM-FE-19 | PR-S2 |

---

### 🟣 Infraestructura / Integración

| RF | AC | Capa | Sprint | Test | Commit | PR |
|----|----|------|--------|------|--------|----|
| RF-05.2 | AC-05.2 | On-chain + Off-chain | S1 | TST-INTEG-01 | CM-INTEG-01 | PR-S1 |

---

## 3. Reglas de Auditoría

1. Ningún RF puede quedar sin AC asociado.
2. Ningún AC puede quedar sin test automatizado.
3. Ningún commit puede existir sin referenciar RF y AC.
4. Ningún PR puede aprobarse sin validación de tests.
5. Todo despliegue deberá estar vinculado a una versión etiquetada (vX.Y.Z).