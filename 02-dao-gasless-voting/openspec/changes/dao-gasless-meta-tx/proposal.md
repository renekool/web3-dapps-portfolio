# Proposal: dao-gasless-meta-tx

## Problem
Actualmente, el contrato `DAOVoting` requiere que el usuario real (sender) pague las tarifas de Gas de Ethereum para realizar cualquier acción (`createProposal`, `vote`, `executeProposal`). Esto crea una barrera de entrada significativa, ya que la participación se restringe únicamente a los miembros que poseen ETH en su wallet específicamente para pagar las tarifas de ejecución.

## Goal
Implementar una infraestructura Gasless (Meta-Transacciones) utilizando los estándares **EIP-2771** (Protocolo seguro para Meta-Transacciones nativas) y **EIP-712** (Hashing y firma de datos estructurados tipados). Esta fase se centra totalmente en actualizar el contrato de la DAO para confiar en un forwarder y desplegar un `MinimalForwarder` para que un relayer pueda cubrir los costos de gas de los usuarios finales.

## Proposed Solution
1. **Integración del Contexto EIP-2771**:
   - Actualizar `DAOVoting.sol` para heredar de `ERC2771Context` de OpenZeppelin.
   - Asegurar que donde actualmente usamos `msg.sender`, se encamine sin problemas a `_msgSender()` para extraer al firmante original enviado por el Forwarder.
2. **Desplegar Minimal Forwarder**:
   - Instalar o redactar un `MinimalForwarder.sol` estándar (compatible con EIP-712 + EIP-2771) que actúe como el forwarder de confianza.
3. **Inicializar Forwarder de Confianza**:
   - Pasar la dirección del Minimal Forwarder al constructor de `DAOVoting` e inmovilizarla como el `trustedForwarder`.
4. **Arquitectura de Pruebas**:
   - Introducir pruebas en Foundry que simulen firmas off-chain (EIP-712).
   - Mockear un Relayer actuando como `msg.sender` mientras se verifica que la DAO atribuye correctamente la acción al firmante original.

## Non-goals
- NO construiremos el servidor Relayer off-chain (API) ni el frontend todavía. Esta fase trata puramente de la preparación de los smart contracts para las meta-transacciones.
- NO implementaremos Paymasters personalizados (ERC-4337). Nos ceñimos estrictamente al patrón de Forwarder solicitado en `docs/01-vision-contexto.md`.
