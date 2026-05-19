#!/bin/bash
BASE_DIR="/home/rene/web3-dev/doing/03-ecommerce-doing"
EURO_TOKEN_ADDR="0x5FbDB2315678afecb367f032d93F642f64180aa3"
ECOMM_ADDR="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
ANVIL_RPC="http://localhost:8545"

inject_env() {
    local target_path=$1
    local extra_content=$2
    mkdir -p "$(dirname "$target_path")/deployments"
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

    local base_target=$(dirname "$target_path")
    mkdir -p "$base_target/deployments"
    mkdir -p "$base_target/lib/abi"
    cp "$BASE_DIR/stablecoin/sc/eurotoken/out/EuroToken.sol/EuroToken.json" "$base_target/deployments/EuroToken.abi.json" 2>/dev/null || true
    cp "$BASE_DIR/ecommerce/sc/out/Ecommerce.sol/Ecommerce.json" "$base_target/deployments/Ecommerce.abi.json" 2>/dev/null || true
    cp "$BASE_DIR/stablecoin/sc/eurotoken/out/EuroToken.sol/EuroToken.json" "$base_target/lib/abi/EuroToken.json" 2>/dev/null || true
    cp "$BASE_DIR/ecommerce/sc/out/Ecommerce.sol/Ecommerce.json" "$base_target/lib/abi/Ecommerce.json" 2>/dev/null || true
}

STRIPE_PK="pk_test_placeholder_from_antigravity_web3_dev"
STRIPE_SK="sk_test_placeholder_from_antigravity_web3_dev"
STRIPE_WH="whsec_placeholder_from_antigravity_web3_dev"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

inject_env "$BASE_DIR/stablecoin/web-landing/.env.local" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK\nSTRIPE_SECRET_KEY=$STRIPE_SK\nSTRIPE_WEBHOOK_SECRET=$STRIPE_WH\nWALLET_PRIVATE_KEY=$PRIVATE_KEY\nNEXT_PUBLIC_LANDING_URL=http://localhost:7001\nNEXT_PUBLIC_PURCHASE_URL=http://localhost:7001/compra"
inject_env "$BASE_DIR/ecommerce/web-payment-gateway/.env.local" "NEXT_PUBLIC_CUSTOMER_URL=http://localhost:7004"
inject_env "$BASE_DIR/ecommerce/web-admin/.env.local" ""
inject_env "$BASE_DIR/ecommerce/web-customer/.env.local" "NEXT_PUBLIC_PASARELA_URL=http://localhost:7002"
