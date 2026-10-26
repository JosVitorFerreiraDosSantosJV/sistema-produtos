#!/bin/sh

set -e

echo "Iniciando Sistema de Produtos..."
echo "Porta: ${PORT:-4000}"
echo "Ambiente: ${NODE_ENV:-production}"

exec node server.js "$@"
