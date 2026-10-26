#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

echo "================================"
echo "   DEPLOY - SISTEMA DE PRODUTOS"
echo "================================"

read -rp "Digite a porta da aplicação [4000]: " PORT
PORT="${PORT:-4000}"

echo
echo "Selecione o ambiente:"
echo "1) development"
echo "2) production"

read -rp "Digite a opção [2]: " OPCAO
OPCAO="${OPCAO:-2}"

case "$OPCAO" in
  1) NODE_ENV="development" ;;
  2) NODE_ENV="production" ;;
  *)
    echo "Opção inválida!"
    exit 1
    ;;
esac

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || \
   (( PORT < 1 || PORT > 65535 )); then
  echo "Porta inválida! Escolha um número entre 1 e 65535."
  exit 1
fi

export PORT NODE_ENV

echo
echo "Porta selecionada: $PORT"
echo "Ambiente selecionado: $NODE_ENV"
echo

docker compose up -d --build backend

echo
echo "Deploy solicitado com sucesso!"
echo "Porta: $PORT"
echo "Ambiente: $NODE_ENV"

