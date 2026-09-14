#!/bin/bash
# Sube la app web al VPS: https://laspinchisalitas.tech/proyectos/appcomidas/
# Uso: ./subir-al-vps.sh      (necesita el host "pinchis" de ~/.ssh/config)
set -euo pipefail
cd "$(dirname "$0")"

DESTINO="pinchis:/var/www/pinchis/proyectos/appcomidas/"
ssh pinchis 'mkdir -p /var/www/pinchis/proyectos/appcomidas'

rsync -rltv --delete \
  --exclude '.git' --exclude '.claude' --exclude 'android' --exclude 'tests' --exclude '.github' \
  --exclude 'node_modules' --exclude 'server.js' --exclude 'package.json' --exclude 'README.md' \
  --exclude 'Iniciar app.command' --exclude 'subir-al-vps.sh' --exclude '.gitignore' --exclude '.DS_Store' \
  --exclude '*.apk' \
  ./ "$DESTINO"

ssh pinchis 'chown -R www-data:www-data /var/www/pinchis/proyectos/appcomidas'
echo
echo "Listo: https://laspinchisalitas.tech/proyectos/appcomidas/"
