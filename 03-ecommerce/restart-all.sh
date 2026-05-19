#!/bin/bash

# ==============================================================================
# ORCHESTRATOR: RESTART ALL SYSTEM
# ==============================================================================
# Automatiza el levantamiento del ecosistema Ecommerce Web3 completo.
# ==============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANVIL_RPC="http://localhost:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo -e "${BLUE}=== Iniciando Orquestación del Sistema Web3 ===${NC}"

# 1. Cleanup y Reset de Puertos (A6 Orchestration - Ultra-Safe Mode)
echo -e "${YELLOW}Step 1: Cleanup y Liberación de Puertos (Aislado)...${NC}"

# Paso 1a: pkill garantizado — más fiable que fuser en WSL2
# Mata Anvil por nombre de proceso antes del ciclo por puerto
echo -e "  Matando procesos Anvil y Next.js por nombre..."
pkill -9 -f "anvil" 2>/dev/null || true
pkill -9 -f "next-server\|next dev\|next start" 2>/dev/null || true
pkill -9 -f "node.*next" 2>/dev/null || true
sleep 2

# Helper para detener servicios de forma segura por puerto
stop_service_by_port() {
    local port=$1
    echo -n "  Limpiando puerto $port... "

    # fuser como segunda capa (complementa pkill)
    local PIDS=$(fuser $port/tcp 2>/dev/null || true)

    if [ -n "$PIDS" ]; then
        echo -e "${RED}PID(s): $PIDS. Deteniendo...${NC}"
        kill -15 $PIDS 2>/dev/null || true
        sleep 1

        local REMAINING=$(fuser $port/tcp 2>/dev/null || true)
        if [ -n "$REMAINING" ]; then
            kill -9 $REMAINING 2>/dev/null || true
            sleep 1
        fi

        fuser -k -n tcp $port >/dev/null 2>&1 || true
    else
        echo -e "${GREEN}Libre${NC}"
    fi
}

# Lista de puertos críticos
PORTS=(7001 7002 7003 7004 8545)

for port in "${PORTS[@]}"; do
    stop_service_by_port $port
done

# VERIFICACIÓN BLOQUEANTE: No seguir hasta que los puertos estén REALMENTE libres
echo -e "${YELLOW}  Verificando liberación total de puertos...${NC}"
for port in "${PORTS[@]}"; do
    ITER=0
    while fuser $port/tcp >/dev/null 2>&1; do
        if [ $ITER -ge 5 ]; then
            echo -e "${RED}ERROR: Puerto $port no se libera tras varios intentos. Abortando.${NC}"
            exit 1
        fi
        echo -e "  Esperando puerto $port... ($ITER)"
        sleep 2
        ITER=$((ITER+1))
    done
done

# Paso 1b: Purge de .next cache — elimina bundles compilados con env vars stale
echo -e "  Purgando .next caches..."
rm -rf "$BASE_DIR/stablecoin/web-landing/.next"
rm -rf "$BASE_DIR/ecommerce/web-payment-gateway/.next"
rm -rf "$BASE_DIR/ecommerce/web-admin/.next"
rm -rf "$BASE_DIR/ecommerce/web-customer/.next"
echo -e "  ${GREEN}.next caches eliminados${NC}"

# Paso 1c: Purge completo de Forge — rebuild desde cero sin artefactos previos
echo -e "  Purgando Forge artifacts (broadcast + out + cache)..."
rm -rf "$BASE_DIR/stablecoin/sc/eurotoken/broadcast"
rm -rf "$BASE_DIR/stablecoin/sc/eurotoken/out"
rm -rf "$BASE_DIR/stablecoin/sc/eurotoken/cache"
rm -rf "$BASE_DIR/ecommerce/sc/broadcast"
rm -rf "$BASE_DIR/ecommerce/sc/out"
rm -rf "$BASE_DIR/ecommerce/sc/cache"
echo -e "  ${GREEN}Forge artifacts eliminados — rebuild garantizado${NC}"

# Limpiar logs de ejecuciones anteriores
find "$BASE_DIR" -name "*.log" -delete 2>/dev/null || true

echo -e "  ${BLUE}Cleanup completado. Ecosistema verificado como libre.${NC}"
sleep 1

# NOTA DE VALIDACION (A6):
# Para probar la integración funcional Web3, utilizar obligatoriamente
# el servidor de chrome-devtools para interactuar con la billetera mock.

# 2. Iniciar Anvil — estado limpio garantizado (sin flags de persistencia)
echo -e "${YELLOW}Step 2: Starting Anvil Blockchain...${NC}"
anvil > anvil.log 2>&1 &
ANVIL_PID=$!

# Esperar hasta que el RPC responda realmente (curl — más fiable que lsof en WSL2)
ITER=0
until curl -sf -X POST "$ANVIL_RPC" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    >/dev/null 2>&1; do
    if [ $ITER -ge 15 ]; then
        echo -e "${RED}ERROR: Anvil no respondió en 15 segundos. Revisa anvil.log${NC}"
        cat "$BASE_DIR/anvil.log" | tail -20
        exit 1
    fi
    sleep 1
    ITER=$((ITER+1))
done
echo "  Anvil listo en puerto 8545 (PID $ANVIL_PID)"

# 3. Desplegar EuroToken (Capa A)
echo -e "${YELLOW}Step 3: Deploying EuroToken (Stablecoin)...${NC}"
cd "$BASE_DIR/stablecoin/sc/eurotoken"
forge build --force 2>&1 | tail -3
DEPLOY_TOKEN_OUT=$(forge script script/DeployEuroToken.s.sol:DeployEuroToken --rpc-url $ANVIL_RPC --broadcast --private-key $PRIVATE_KEY -vv 2>&1)
EURO_TOKEN_ADDR=$(echo "$DEPLOY_TOKEN_OUT" | grep "EuroToken deployed at:" | grep -oE '0x[a-fA-F0-9]{40}')

if [ -z "$EURO_TOKEN_ADDR" ]; then
    echo -e "${RED}ERROR: No se pudo obtener la dirección de EuroToken${NC}"
    echo "$DEPLOY_TOKEN_OUT"
    exit 1
fi
echo -e "  ${GREEN}EuroToken: $EURO_TOKEN_ADDR${NC}"

# 4. Desplegar Ecommerce (Capa B)
echo -e "${YELLOW}Step 4: Deploying Ecommerce Contract...${NC}"
cd "$BASE_DIR/ecommerce/sc"
forge build --force 2>&1 | tail -3
DEPLOY_ECOMM_OUT=$(EURO_TOKEN_ADDRESS=$EURO_TOKEN_ADDR forge script script/DeployEcommerce.s.sol:DeployEcommerceScript --rpc-url $ANVIL_RPC --broadcast --private-key $PRIVATE_KEY -vv 2>&1)
ECOMM_ADDR=$(echo "$DEPLOY_ECOMM_OUT" | grep "Ecommerce deployed at:" | grep -oE '0x[a-fA-F0-9]{40}')

if [ -z "$ECOMM_ADDR" ]; then
    echo -e "${RED}ERROR: No se pudo obtener la dirección de Ecommerce${NC}"
    echo "$DEPLOY_ECOMM_OUT"
    exit 1
fi
echo -e "  ${GREEN}Ecommerce: $ECOMM_ADDR${NC}"

# 5. Sincronización de ABIs y .env.local
echo -e "${YELLOW}Step 5: Synchronizing Environment and ABIs...${NC}"

# Helper para inyectar variables
inject_env() {
    local target_path=$1
    local extra_content=$2
    
    mkdir -p "$(dirname "$target_path")/deployments"
    
    # Escribir .env.local
    {
        echo "EUROTOKEN_CONTRACT_ADDRESS=$EURO_TOKEN_ADDR"
        echo "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EURO_TOKEN_ADDR"
        echo "ECOMMERCE_CONTRACT_ADDRESS=$ECOMM_ADDR"
        echo "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMM_ADDR"
        echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$ECOMM_ADDR"
        echo "RPC_URL=$ANVIL_RPC"
        echo "NEXT_PUBLIC_RPC_URL=$ANVIL_RPC"
        echo "NEXT_PUBLIC_CHAIN_ID=31337"
        [ -n "$extra_content" ] && echo -e "$extra_content" || true
    } > "$target_path"

    # Copiar ABIs (Soporte dual: deployments/ y lib/abi/)
    local base_target=$(dirname "$target_path")
    mkdir -p "$base_target/deployments"
    mkdir -p "$base_target/lib/abi"
    
    cp "$BASE_DIR/stablecoin/sc/eurotoken/out/EuroToken.sol/EuroToken.json" "$base_target/deployments/EuroToken.abi.json" 2>/dev/null || true
    cp "$BASE_DIR/ecommerce/sc/out/Ecommerce.sol/Ecommerce.json" "$base_target/deployments/Ecommerce.abi.json" 2>/dev/null || true
    
    cp "$BASE_DIR/stablecoin/sc/eurotoken/out/EuroToken.sol/EuroToken.json" "$base_target/lib/abi/EuroToken.json" 2>/dev/null || true
    cp "$BASE_DIR/ecommerce/sc/out/Ecommerce.sol/Ecommerce.json" "$base_target/lib/abi/Ecommerce.json" 2>/dev/null || true
}

# Stripe Config (Test)
STRIPE_PK="pk_test_placeholder_from_antigravity_web3_dev"
STRIPE_SK="sk_test_placeholder_from_antigravity_web3_dev"
STRIPE_WH="whsec_placeholder_from_antigravity_web3_dev"

# Unified App (7001) - Antiguo web-landing
inject_env "$BASE_DIR/stablecoin/web-landing/.env.local" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK\nSTRIPE_SECRET_KEY=$STRIPE_SK\nSTRIPE_WEBHOOK_SECRET=$STRIPE_WH\nWALLET_PRIVATE_KEY=$PRIVATE_KEY\nNEXT_PUBLIC_LANDING_URL=http://localhost:7001\nNEXT_PUBLIC_PURCHASE_URL=http://localhost:7001/compra"
echo "  [OK] Sync: web-landing (Unified on 7001)"

# Web Pasarela (7002)
inject_env "$BASE_DIR/ecommerce/web-payment-gateway/.env.local" "NEXT_PUBLIC_CUSTOMER_URL=http://localhost:7004"
echo "  [OK] Sync: web-payment-gateway"

# Web Admin (7003)
inject_env "$BASE_DIR/ecommerce/web-admin/.env.local" ""
echo "  [OK] Sync: web-admin"

# Web Customer (7004)
inject_env "$BASE_DIR/ecommerce/web-customer/.env.local" "NEXT_PUBLIC_PASARELA_URL=http://localhost:7002"
echo "  [OK] Sync: web-customer"

# --- Step 6: Starting Web Applications ---
echo -e "${YELLOW}Step 6: Starting Web Applications...${NC}"

# Define URLs
MASTER_URL="http://localhost:7001"

# Lanzar las 4 apps en paralelo (sin sleeps intermedios)
cd "$BASE_DIR/stablecoin/web-landing"
export PORT=7001
export NEXT_PUBLIC_APP_MODE=unified
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK
nohup npm run dev > app_7001.log 2>&1 &
echo "  [RUN] Unified App ($MASTER_URL)"

cd "$BASE_DIR/ecommerce/web-payment-gateway"
PORT=7002 nohup npm run dev > pasarela.log 2>&1 &
echo "  [RUN] web-payment-gateway (7002)"

cd "$BASE_DIR/ecommerce/web-admin"
PORT=7003 nohup npm run dev > admin.log 2>&1 &
echo "  [RUN] web-admin (7003)"

cd "$BASE_DIR/ecommerce/web-customer"
PORT=7004 nohup npm run dev > customer.log 2>&1 &
echo "  [RUN] web-customer (7004)"

# Verificación PARALELA: un solo loop para las 4 apps (máx 90s total)
echo -e "${YELLOW}Esperando que las apps arranquen...${NC}"
APP_PORTS=(7001 7002 7003 7004)
APP_NAMES=("web-landing" "web-pasarela" "web-admin" "web-customer")
DEADLINE=$((SECONDS + 90))
PENDING=(0 1 2 3)  # índices pendientes de confirmar

while [ ${#PENDING[@]} -gt 0 ] && [ $SECONDS -lt $DEADLINE ]; do
    STILL_PENDING=()
    for i in "${PENDING[@]}"; do
        if fuser ${APP_PORTS[$i]}/tcp >/dev/null 2>&1; then
            echo -e "  ${GREEN}[OK] ${APP_NAMES[$i]} :${APP_PORTS[$i]}${NC}"
        else
            STILL_PENDING+=($i)
        fi
    done
    PENDING=("${STILL_PENDING[@]}")
    [ ${#PENDING[@]} -gt 0 ] && sleep 2
done

# Reportar cualquier app que no levantó
for i in "${PENDING[@]}"; do
    echo -e "  ${RED}WARN: ${APP_NAMES[$i]} (puerto ${APP_PORTS[$i]}) no respondió. Revisa el log.${NC}"
done

# 7. Verificación de Servicios y Protocolo de Validación AI
echo -e "${YELLOW}Step 7: Final Service Verification...${NC}"

check_url() {
    local url=$1
    local name=$2
    if curl -s --head  --request GET "$url" | grep "200" > /dev/null; then
        echo -e "  ${GREEN}[READY]${NC} $name está respondiendo correctamente."
    else
        echo -e "  ${RED}[WARN]${NC} $name no respondió con 200 OK. Verifica logs."
    fi
}

check_url "http://localhost:7001" "Landing/Unified"
check_url "http://localhost:7003" "Web Admin"

echo -e "\n${GREEN}✔ Ecosistema UNIFICADO orquestado exitosamente!${NC}"
echo -e "${BLUE}--------------------------------------------------${NC}"
echo -e "Anvil:   http://localhost:8545"
echo -e "App Unificada: http://localhost:7001 (Landing + Compra)"
echo -e "Pasarela: http://localhost:7002"
echo -e "Admin:    http://localhost:7003"
echo -e "Shop:     http://localhost:7004"
echo -e "--------------------------------------------------${NC}"

# ==============================================================================
# PROTOCOLO DE VALIDACIÓN AI (CRITICAL: SIEMPRE USA CHROME-DEVTOOLS)
# ==============================================================================
# INSTRUCCIÓN OBLIGATORIA PARA EL AGENTE AI:
# Tras finalizar este script, DEBES utilizar el MCP chrome-devtools para:
# 1. Validar el Landing Page (7001):
#    - Verificar estado ANONYMOUS y paridad visual Terra Warm.
# 2. Validar el Web Admin (7003):
#    - Entrar en /products y verificar que los productos on-chain aparecen.
#    - Verificar que no hay errores de 'Contract Connection' en la consola.
# 3. Tomar capturas de pantalla para evidencia de funcionamiento real.
# ==============================================================================

echo -e "\n${RED}>> ACCIÓN CRÍTICA: Ejecutar validación visual con chrome-devtools en :7001 y :7003${NC}"
echo -e "${YELLOW}>> METAMASK: Si el navegador muestra datos previos, resetear cuenta:${NC}"
echo -e "   MetaMask → Settings → Advanced → Reset Account"
echo -e "   Esto limpia el caché de nonces/llamadas RPC del cliente (no afecta fondos en testnets)."
