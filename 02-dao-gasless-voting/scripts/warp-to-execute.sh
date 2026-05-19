#!/bin/bash

# warp-to-execute.sh
# Calcula el tiempo restante de una propuesta y salta hasta 1 minuto antes del timelock.

if [ -z "$1" ]; then
    echo "Uso: ./scripts/warp-to-execute.sh <proposal_id>"
    exit 1
fi

ID=$1
RPC_URL="http://127.0.0.1:8545"

# 1. Obtener dirección del contrato
# Intentar leer de .env.local o usar una variable si se conoce
DAO_ADDR=$(grep NEXT_PUBLIC_DAO_CONTRACT_ADDRESS frontend/.env.local | cut -d '=' -f2)

if [ -z "$DAO_ADDR" ]; then
    echo "❌ Error: No se encontró la dirección de la DAO en frontend/.env.local"
    exit 1
fi

echo "🔍 Consultando propuesta #$ID en $DAO_ADDR..."

# 2. Consultar timelockDeadline (sexto campo del struct Proposal)
# Tipos: address, address, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint8, string
PROP_DATA=$(cast call $DAO_ADDR "proposals(uint256)(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8,string)" $ID --rpc-url $RPC_URL)

# Con tipos, cast call devuelve cada campo en una línea nueva.
# El timelockDeadline es la línea 6.
DEADLINE=$(echo "$PROP_DATA" | sed -n '6p' | awk '{print $1}')

if [ -z "$DEADLINE" ] || [ "$DEADLINE" -eq 0 ]; then
    echo "❌ Error: No se pudo obtener el deadline de la propuesta."
    exit 1
fi

# 3. Obtener tiempo actual
NOW=$(cast block latest --rpc-url $RPC_URL | grep timestamp | awk '{print $2}')

echo "📅 Timelock Deadline: $DEADLINE"
echo "🕒 Tiempo actual:     $NOW"

DIFF=$((DEADLINE - NOW))

if [ "$DIFF" -le 60 ]; then
    echo "⚠️ La propuesta ya está por vencer o ya venció ($DIFF segundos restantes)."
    exit 0
fi

# 4. Calcular salto (queremos que falten 60 segundos)
JUMP=$((DIFF - 60))

echo "⏩ Saltando $JUMP segundos para que falte exactamente 1 minuto..."

# Ejecutar el salto usando el script base
./scripts/advance-time.sh $JUMP
