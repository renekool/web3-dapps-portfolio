#!/bin/bash

# advance-time.sh
# Permite adelantar el tiempo en la blockchain local para probar lógica temporal.

if [ -z "$1" ]; then
    echo "Uso: ./scripts/advance-time.sh <segundos>"
    echo ""
    echo "Ejemplos:"
    echo "  ./scripts/advance-time.sh 3600    # +1 hora"
    echo "  ./scripts/advance-time.sh 86400   # +1 día"
    echo "  ./scripts/advance-time.sh 604800  # +7 días"
    exit 1
fi

SECONDS=$1

echo "⏰ Adelantando tiempo en $SECONDS segundos..."

# Aumentar tiempo
cast rpc evm_increaseTime $SECONDS --rpc-url http://127.0.0.1:8545 > /dev/null

# Minar bloque para consolidar
cast rpc evm_mine --rpc-url http://127.0.0.1:8545 > /dev/null

echo -e "\033[0;32m✅ Tiempo adelantado con éxito.\033[0m"

# Mostrar timestamp actual
NEW_TIME=$(cast block latest --rpc-url http://127.0.0.1:8545 | grep timestamp | awk '{print $2}')
echo "Timestamp actual del bloque: $NEW_TIME"
