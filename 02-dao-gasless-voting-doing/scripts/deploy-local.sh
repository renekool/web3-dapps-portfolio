#!/bin/bash

# deploy-local.sh
# Automatiza el despliegue local: Compilación -> Despliegue -> Sincronización de Frontend.

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Iniciando despliegue local...${NC}\n"

# 1. Verificar Anvil antes de empezar
if ! curl -s http://127.0.0.1:8545 > /dev/null; then
    echo -e "${RED}❌ Error: Anvil no está corriendo en http://127.0.0.1:8545${NC}"
    echo "Por favor abre otra terminal y ejecuta 'anvil'."
    exit 1
fi

# Configuración por defecto (Anvil Account #0)
ANVIL_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ANVIL_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# 2. Preparar Contratos
echo -e "📦 Compilando contratos..."
cd contracts
forge build --silent

# Crear .env en contracts si no existe (necesario para el script de deploy)
if [ ! -f .env ]; then
    echo "PRIVATE_KEY=$ANVIL_PRIVATE_KEY" > .env
    echo "RPC_URL=http://127.0.0.1:8545" >> .env
fi

# 3. Ejecutar Deployment
echo -e "📝 Desplegando en Anvil..."
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol:DeployScript \
    --rpc-url http://127.0.0.1:8545 \
    --broadcast \
    --private-key $ANVIL_PRIVATE_KEY)

# Extraer direcciones (usando grep y awk para mayor robustez)
FORWARDER_ADDR=$(echo "$DEPLOY_OUTPUT" | grep "MinimalForwarder deployed at:" | awk '{print $NF}')
DAO_ADDR=$(echo "$DEPLOY_OUTPUT" | grep "DAOVoting deployed at:" | awk '{print $NF}')

if [ -z "$FORWARDER_ADDR" ] || [ -z "$DAO_ADDR" ]; then
    echo -e "${RED}❌ Error: No se pudieron capturar las direcciones de despliegue.${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ Contratos desplegados:${NC}"
echo -e "  - DAO: $DAO_ADDR"
echo -e "  - Forwarder: $FORWARDER_ADDR"

# 4. Generar ABIs para el Frontend
echo -e "\n📋 Generando ABIs para el frontend..."
mkdir -p ../frontend/lib/abi
node -e "const fs = require('fs'); const dao = JSON.parse(fs.readFileSync('out/DAOVoting.sol/DAOVoting.json')); fs.mkdirSync('../frontend/lib/abi', { recursive: true }); fs.writeFileSync('../frontend/lib/abi/DAOVoting.json', JSON.stringify(dao.abi, null, 2)); const forwarder = JSON.parse(fs.readFileSync('out/MinimalForwarder.sol/MinimalForwarder.json')); fs.writeFileSync('../frontend/lib/abi/MinimalForwarder.json', JSON.stringify(forwarder.abi, null, 2));"

# 5. Sincronizar Variables de Entorno en Frontend
echo -e "⚙️ Actualizando frontend/.env.local..."
cat > ../frontend/.env.local << EOF
# Web3 Smart Contracts (Public)
NEXT_PUBLIC_DAO_CONTRACT_ADDRESS=$DAO_ADDR
NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS=$FORWARDER_ADDR

# Dev Blockchain
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Relayer Config (Private)
RELAYER_PRIVATE_KEY=$ANVIL_PRIVATE_KEY
RELAYER_ADDRESS=$ANVIL_ADDRESS
EOF

echo -e "\n${GREEN}=========================================="
echo -e "✅ ¡Despliegue y Sincronización Exitosa!"
echo -e "==========================================${NC}"
echo -e "\nPróximos pasos:"
echo -e "1. cd frontend && npm run dev"
echo -e "2. Configura MetaMask en Localhost (Chain ID 31337)"
echo -e "3. Importa cuenta #1 de Anvil para probar."
