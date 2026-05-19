# Feedback: Depuración y Estabilización del Sistema de Registro

Este documento detalla las intervenciones técnicas realizadas para resolver los errores de decodificación y estabilizar el flujo completo de almacenamiento y verificación de documentos.

---

## 1. Feedback: Módulo de Almacenamiento (Upload & Store)

**Problema Detectado:**
Al intentar ejecutar **Store on Blockchain**, la consola mostraba `Error: could not decode result data` con un valor `0x`.

**Causa Raíz:**
El frontend intentaba comunicarse con una dirección de contrato (`0xe7f172...`) que no existía en el estado actual de la red Anvil (o que había sido borrada tras un reinicio del nodo). Al no encontrar código en esa dirección, la red devolvía un bytecode vacío, provocando el error de decodificación en Ethers.js.

**Soluciones Aplicadas:**
- **Sincronización de Red:** Se reinició el nodo Anvil para asegurar un estado limpio y predecible.
- **Despliegue Atómico:** Se ejecutó `forge clean` y `forge build` seguido de un nuevo despliegue en la dirección estándar `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
- **Actualización de Entorno:** Se alinearon los archivos `.env.local` y `Web3Context.tsx` con la dirección del contrato real.
- **Consolidación de ABI:** Se garantizó que el archivo `dapp/contracts/DocumentRegistry.json` contuviera la definición exacta de la función `storeDocumentHash` con sus 4 parámetros.

---

## 2. Feedback: Módulo de Verificación (Verify Document)

**Problema Detectado:**
La función `getDocumentInfo` fallaba con el error `BAD_DATA`, incluso cuando el documento existía on-chain.

**Causa Raíz:**
Existía una incompatibilidad en la forma en que Ethers 6 interpretaba los valores dinámicos (como la firma en `bytes`) cuando se devolvían como múltiples valores sueltos. Solidity enviaba un puntero de memoria que Ethers no lograba decodificar correctamente en el contexto de una dApp React.

**Soluciones Aplicadas:**
- **Refactorización a Estructuras (Tuplas):** Se modificó el Smart Contract (`DocumentRegistry.sol`) para que la función `getDocumentInfo` devuelva el struct `Document` directamente. Esto permite que Ethers lo trate como un objeto (Tuple) bien definido.
- **Eliminación de Advertencias (Warnings):** Se limpiaron los archivos de prueba (`DocumentRegistry.t.sol`) eliminando imports de `console` sin uso, logrando una compilación 100% limpia.
- **Actualización de ABI en Frontend:** Se sincronizó el ABI para incluir el soporte de componentes de la estructura `Document`.
- **Integración con Ethers 6:** Se ajustó la lógica en `app/verify/page.tsx` para acceder directamente a las propiedades del objeto retornado (`docInfo.signer`, `docInfo.timestamp`, etc.), eliminando la necesidad de desestructuraciones manuales propensas a error.

---

## Conclusión Técnica
El sistema es ahora resiliente a cambios de esquema gracias al uso de estructuras directas para el intercambio de datos. La comunicación entre el Smart Contract y la dApp está vinculada mediante un ABI único y verificado.
