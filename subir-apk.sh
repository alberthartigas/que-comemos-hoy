#!/bin/bash
# Copia la última APK publicada en GitHub al dominio, para compartir un enlace corto:
#   https://laspinchisalitas.tech/proyectos/appcomidas/que-comemos-hoy.apk
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
gh release download --repo alberthartigas/que-comemos-hoy --pattern "que-comemos-hoy.apk" --dir dist --clobber
ETIQUETA=$(gh release view --repo alberthartigas/que-comemos-hoy --json tagName --jq .tagName)
CODIGO=${ETIQUETA##*.}
# version.json: respaldo por si la consulta a GitHub falla (la app revisa primero GitHub)
printf '{"versionCode": %s, "versionName": "%s", "url": "https://laspinchisalitas.tech/proyectos/appcomidas/que-comemos-hoy.apk"}\n' "$CODIGO" "${ETIQUETA#v}" > dist/version.json
scp -q dist/que-comemos-hoy.apk dist/version.json pinchis:/var/www/pinchis/proyectos/appcomidas/
ssh pinchis 'chown www-data:www-data /var/www/pinchis/proyectos/appcomidas/que-comemos-hoy.apk /var/www/pinchis/proyectos/appcomidas/version.json'
echo "Listo: https://laspinchisalitas.tech/proyectos/appcomidas/que-comemos-hoy.apk"
