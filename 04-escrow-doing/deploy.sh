#!/bin/bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Config
RPC_URL="http://127.0.0.1:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PORT=3000

echo -e "${BOLD}${BLUE}===================================================${NC}"
echo -e "${BOLD}${BLUE}🚀 Vaultline Escrow - Smart Contract Deployment${NC}"
echo -e "${BOLD}${BLUE}===================================================${NC}"

# 1. Start Anvil if not running
if cast chain-id --rpc-url $RPC_URL > /dev/null 2>&1; then
    echo -e "${GREEN}[✓] Anvil already running${NC}"
else
    echo -e "${YELLOW}[...] Starting Anvil${NC}"
    anvil --host 127.0.0.1 --port 8545 > ../anvil.log 2>&1 &
    ANVIL_PID=$!
    # Wait up to 10s for Anvil to be ready
    ATTEMPTS=0
    until cast chain-id --rpc-url $RPC_URL > /dev/null 2>&1; do
        sleep 0.5
        ATTEMPTS=$((ATTEMPTS + 1))
        if [ $ATTEMPTS -ge 20 ]; then
            echo -e "${RED}[✗] Anvil failed to start. Check anvil.log${NC}"
            exit 1
        fi
    done
    echo -e "\033[1A\033[2K${GREEN}[✓] Anvil started (PID: $ANVIL_PID, log: anvil.log)${NC}"
fi

# 2. Check Port 3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Port $PORT in use — killing previous instance${NC}"
    kill -9 $(lsof -t -i:$PORT) 2>/dev/null || true
    sleep 1
fi
echo -e "${GREEN}[✓] Port $PORT availability check${NC}"

# 3. Update submodules
git submodule update --init --recursive > /dev/null 2>&1
echo -e "${GREEN}[✓] Updating submodules${NC}"

# 4. Build
echo -e "${YELLOW}[...] Building contracts${NC}"
cd sc
forge build --quiet
echo -e "\033[1A\033[2K${GREEN}[✓] Building contracts${NC}"

# 5. Deploy Tokens
echo -e "${YELLOW}[...] Deploying Tokens${NC}"
TOKEN_A_OUTPUT=$(forge create --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY src/tokens/TokenA.sol:TokenA)
TOKEN_A_ADDRESS=$(echo "$TOKEN_A_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

TOKEN_B_OUTPUT=$(forge create --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY src/tokens/TokenB.sol:TokenB)
TOKEN_B_ADDRESS=$(echo "$TOKEN_B_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo -e "\033[1A\033[2K${GREEN}[✓] Deploying Tokens${NC}"
echo -e "    ${BLUE}Token A:${NC} $TOKEN_A_ADDRESS"
echo -e "    ${BLUE}Token B:${NC} $TOKEN_B_ADDRESS"

# 6. Deploy Escrow
echo -e "${YELLOW}[...] Deploying Escrow${NC}"
ESCROW_OUTPUT=$(forge create --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY src/Escrow.sol:Escrow --constructor-args "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
ESCROW_ADDRESS=$(echo "$ESCROW_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo -e "\033[1A\033[2K${GREEN}[✓] Deploying Escrow${NC}"
echo -e "    ${BLUE}Escrow:${NC}  $ESCROW_ADDRESS"

# 7. Register Tokens
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $ESCROW_ADDRESS "addToken(address)" $TOKEN_A_ADDRESS > /dev/null 2>&1
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $ESCROW_ADDRESS "addToken(address)" $TOKEN_B_ADDRESS > /dev/null 2>&1
echo -e "${GREEN}[✓] Registering tokens in Escrow${NC}"

# 8. Minting
ACCOUNTS=(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
    "0x976EA74026E726554dB657fF54063a01021755E4"
    "0xA0Ee7A142d267C1f36714E4a8F75612F20a79720"
    "0xBcd4042DE499D14e55001CcbB24a551F3b989b65"
    "0x11e02b6d0f120174208bc282f7a63d5df01c130a"
)

for ACC in "${ACCOUNTS[@]}"; do
    cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $TOKEN_A_ADDRESS "mint(address,uint256)" $ACC 1000000000000000000000 > /dev/null 2>&1
    cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $TOKEN_B_ADDRESS "mint(address,uint256)" $ACC 1000000000000000000000 > /dev/null 2>&1
done
echo -e "${GREEN}[✓] Minting initial supply to accounts${NC}"

# 9. Frontend config
# Update ESCROW_ADDRESS (safe: no special chars in hex addresses)
sed -i "s/export const ESCROW_ADDRESS = '.*' as const;/export const ESCROW_ADDRESS = '$ESCROW_ADDRESS' as const;/g" ../web/lib/contracts.ts

# Update ESCROW_ABI via Python — ABI JSON contains '/' which breaks sed delimiters
python3 - "$ESCROW_ADDRESS" <<'PYEOF'
import re, json, sys

contracts_path = "../web/lib/contracts.ts"
abi_path = "out/Escrow.sol/Escrow.json"

with open(contracts_path, "r") as f:
    content = f.read()

with open(abi_path, "r") as f:
    abi = json.dumps(json.load(f)["abi"], separators=(",", ":"))

# Replace the entire ESCROW_ABI line (single line, ends with 'as const;')
new_content = re.sub(
    r"export const ESCROW_ABI = \[.*?\] as const;",
    f"export const ESCROW_ABI = {abi} as const;",
    content,
    flags=re.DOTALL,
)

with open(contracts_path, "w") as f:
    f.write(new_content)
PYEOF

echo "NEXT_PUBLIC_RPC_URL=$RPC_URL" > ../web/.env.local
echo "NEXT_PUBLIC_CHAIN_ID=31337" >> ../web/.env.local
echo "NEXT_PUBLIC_ESCROW_ADDRESS=$ESCROW_ADDRESS" >> ../web/.env.local
echo "NEXT_PUBLIC_TOKEN_A_ADDRESS=$TOKEN_A_ADDRESS" >> ../web/.env.local
echo "NEXT_PUBLIC_TOKEN_B_ADDRESS=$TOKEN_B_ADDRESS" >> ../web/.env.local
echo "NEXT_PUBLIC_DEBUG_BALANCES=true" >> ../web/.env.local
echo -e "${GREEN}[✓] Updating frontend configuration${NC}"

# 10. Deployment info
cat <<EOF > ../deployment-info.txt
Deployment Date: $(date)
Network: Anvil (31337)
Escrow: $ESCROW_ADDRESS
Token A: $TOKEN_A_ADDRESS
Token B: $TOKEN_B_ADDRESS
EOF

# 11. Start Frontend
echo -e "${YELLOW}[...] Starting web application on port $PORT${NC}"
cd ../web
# Start in background, redirect output to a log file
npm run dev -- -p $PORT > ../web-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
ATTEMPTS=0
MAX_ATTEMPTS=30
while ! curl -s http://localhost:$PORT > /dev/null; do
    sleep 1
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
        echo -e "${RED}[✗] Web application failed to start${NC}"
        exit 1
    fi
done

echo -e "\033[1A\033[2K${GREEN}[✓] Web application started (PID: $SERVER_PID)${NC}"

echo -e "\n${BOLD}${GREEN}✨ Deployment and startup successful!${NC}"
echo -e "${BLUE}---------------------------------------------------${NC}"
echo -e "${BOLD}Escrow:${NC}  $ESCROW_ADDRESS"
echo -e "${BOLD}Token A:${NC} $TOKEN_A_ADDRESS"
echo -e "${BOLD}Token B:${NC} $TOKEN_B_ADDRESS"
echo -e "${BOLD}URL:${NC}     http://localhost:$PORT"
echo -e "${BLUE}---------------------------------------------------${NC}"
echo -e "${YELLOW}💡 Para detener el servidor: kill $SERVER_PID${NC}\n"
