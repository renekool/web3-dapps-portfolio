# 🛠️ Guía de Configuración del Entorno

Esta guía explica cómo levantar el entorno de desarrollo local para el proyecto DAO Gasless Voting.

## Pre-requisitos

1. **Foundry**: Para compilar y desplegar contratos.
2. **Node.js**: Para ejecutar el frontend (Next.js).
3. **Anvil**: El nodo de blockchain local incluido en Foundry.

## Flujo de Inicio Rápido

### 1. Levantar la Blockchain
En una terminal dedicada, inicia el nodo local:
```bash
anvil
```

### 2. Verificar el Entorno
Usa el script de diagnóstico para asegurar que todo está en su lugar:
```bash
./scripts/check-setup.sh
```

### 3. Desplegar Contratos y Sincronizar Frontend
Este comando compilará los contratos, los desplegará en Anvil y configurará automáticamente el `.env.local` del frontend con las nuevas direcciones:
```bash
./scripts/deploy-local.sh
```

### 4. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Scripts Disponibles

| Script | Descripción | Cuándo usarlo |
| :--- | :--- | :--- |
| `check-setup.sh` | Valida dependencias, servicios y archivos. | Al iniciar el día o tras un error. |
| `deploy-local.sh` | Compila, despliega y actualiza el frontend. | Tras cambiar contratos o resetear Anvil. |
| `advance-time.sh` | Adelanta el tiempo de la blockchain (en segundos). | Para testear votaciones y deadlines. |

### Ejemplo de uso de tiempo:
Para simular que han pasado 2 días y poder ejecutar una propuesta:
```bash
./scripts/advance-time.sh 172800
```
*(172,800 seg = 2 días)*

---

## Estructura de Salida
Tras ejecutar `deploy-local.sh`, encontrarás:
- **ABIs**: En `frontend/lib/abi/`
- **Direcciones**: Configuradas en `frontend/.env.local`
