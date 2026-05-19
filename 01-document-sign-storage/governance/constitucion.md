# Constitución del Proyecto — ETH Document Registry

## 1. Propósito

Este documento define las reglas inmutables que gobiernan el desarrollo del sistema.
Ninguna decisión técnica puede contradecir estas reglas.
La inteligencia artificial actúa como asistente, no como decisor.

---

## 2. Principios Fundamentales

1. La especificación es la fuente de verdad (Spec-as-Source).
2. El código debe cumplir la especificación, no interpretarla libremente.
3. Ninguna implementación puede introducir ambigüedad funcional.
4. Toda lógica crítica debe ser verificable mediante tests.
5. No se acepta código no comprendido completamente.
6. El dominio es independiente de la infraestructura.
7. La arquitectura debe permitir evolución futura hacia testnet sin rediseño del dominio.
8. El entorno actual está limitado a desarrollo local con Anvil.

---

## 3. Reglas Inmutables Técnicas

1. No se almacenará el archivo completo on-chain.
2. El hash utilizado será keccak256.
3. Las firmas digitales usarán ECDSA.
4. El contrato no almacenará datos redundantes.
5. El contrato no contendrá lógica innecesaria de verificación off-chain.
6. El manejo de claves privadas solo está permitido en entorno de desarrollo local.
7. En producción, el frontend nunca manejará claves privadas.
8. Toda interacción on-chain deberá ser explícita y verificable.

---

## 4. Estándares de Desarrollo

1. TypeScript en modo estricto.
2. No uso de `any` sin justificación explícita.
3. Tests obligatorios para lógica de negocio.
4. Commits atómicos.
5. Sin credenciales reales en repositorio.
6. Manejo explícito de errores.
7. No se mergea código sin validación funcional.

---

## 5. Disciplina de Decisión

Las decisiones de arquitectura y dominio las toma el equipo humano.
La IA puede sugerir, pero no define reglas.

---

## 6. Relación con la Especificación

La especificación funcional (spec.md) es el documento operativo.
Si el código contradice la especificación, el código está incorrecto.