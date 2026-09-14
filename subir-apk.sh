#!/bin/bash
# Copia la última APK publicada en GitHub al dominio, para compartir un enlace corto:
#   https://laspinchisalitas.tech/proyectos/appcomidas/que-comemos-hoy.apk
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
gh release download --repo alberthartigas/que-comemos-hoy --pattern "que-comemos-hoy.apk" --dir dist --clobber
scp -q dist/que-comemos-hoy.apk pinchis:/var/www/pinchis/proyectos/appcomidas/que-comemos-hoy.apk
ssh pinchis 'chown www-data:www-data /var/www/pinchis/proyectos/appcomidas/que-comemos-hoy.apk'
echo "Listo: https://laspinchisalitas.tech/proyectos/appcomidas/que-comemos-hoy.apk"
