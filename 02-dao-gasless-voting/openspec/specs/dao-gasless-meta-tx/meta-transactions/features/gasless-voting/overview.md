# Overview: Gasless Transactions System (Hybrid Support)

## 1. Vision e Intencion
El sistema Gasless permite a los usuarios participar en la gobernanza (crear propuestas y votar) sin poseer ETH para gas. Esto se logra delegando el costo de las transacciones a un **Relayer** centralizado de confianza, manteniendo la seguridad mediante firmas digitales **EIP-712**.

## 2. Modo Hibrido (Opt-in)
El sistema NO es exclusivamente gasless. Se diseña para coexistir con el flujo estandar de Ethereum:

- **Modo Gasless (Relayer Pays)**: El usuario firma off-chain y el relayer envia.
- **Modo Normal (Wallet Pays)**: El usuario envia directamente la transaccion (Fallback).

## 3. Beneficios Esperados
- **Reduccion de barreras**: Los usuarios con poder de voto pero sin gas pueden participar.
- **Diferenciacion UX**: Experiencia de usuario "Web2-like" en aplicaciones Web3 complejos.

## 4. Alcance del Feature
1. **Creacion de Propuestas**: Opcion para delegar gas al crear una propuesta.
2. **Votacion**: Opcion para delegar gas al votar en cualquier propuesta activa.
3. **Relayer API**: Endpoint seguro para recibir y ejecutar firmas validas.
4. **Estado UI**: Tracking detallado de firmas, envios y confirmaciones.
