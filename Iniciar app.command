#!/bin/bash
# Doble clic en este archivo (Mac) para arrancar la app. Cierra la ventana o presiona Ctrl + C para detenerla.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Necesitas Node.js para arrancar la app: https://nodejs.org"
  read -r -p "Presiona Enter para salir"
  exit 1
fi

(sleep 1 && open "http://localhost:${PORT:-8080}") &
node server.js
