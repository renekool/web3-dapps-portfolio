#!/bin/bash

# check-setup.sh
# Valida que el entorno de desarrollo esté listo para el proyecto DAO.

set -e

# Colores para la salida
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Verificando configuración del proyecto...${NC}\n"

ERRORS=0

# 1. Verificar Anvil (Local Blockchain)
echo -n "📡 Blockchain (Anvil): "
if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Funcionando${NC}"
else
    echo -e "${RED}✗ No detectado${NC} (Inicia con 'anvil')"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar Foundry (Forge & Cast)
echo -n "🔨 Foundry (Forge/Cast): "
if command -v forge >/dev/null 2>&1 && command -v cast >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Instalado${NC}"
else
    echo -e "${RED}✗ No instalado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. Verificar Contratos
echo -n "📜 Contratos (Source): "
if [ -f "contracts/src/DAOVoting.sol" ] && [ -f "contracts/src/MinimalForwarder.sol" ]; then
    echo -e "${GREEN}✓ Presentes${NC}"
else
    echo -e "${RED}✗ Faltan archivos en contracts/src${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar Compilación
echo -n "📦 Compilación: "
if [ -d "contracts/out" ]; then
    echo -e "${GREEN}✓ Detectada${NC}"
else
    echo -e "${YELLOW}⚠ No detectada${NC} (Ejecuta ./scripts/deploy-local.sh)"
fi

# 5. Verificar Frontend & Node Modules
echo -n "🌐 Frontend node_modules: "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ Instalados${NC}"
else
    echo -e "${YELLOW}⚠ No instalados${NC} (Ejecuta 'cd frontend && npm install')"
fi

# 6. Verificar Configuración del Relayer
echo -n "⛽ Configuración Relayer (.env.local): "
if [ -f "frontend/.env.local" ]; then
    if grep -q "RELAYER_PRIVATE_KEY" frontend/.env.local; then
        echo -e "${GREEN}✓ Configurada${NC}"
    else
        echo -e "${RED}✗ Falta RELAYER_PRIVATE_KEY en .env.local${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠ No existe .env.local${NC} (Se creará en ./scripts/deploy-local.sh)"
fi

echo -e "\n-------------------------------------"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ¡Todo listo para desarrollar!${NC}"
    exit 0
else
    echo -e "${RED}❌ Se encontraron $ERRORS problemas. Corrige antes de continuar.${NC}"
    exit 1
fi
