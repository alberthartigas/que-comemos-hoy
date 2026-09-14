#!/bin/bash
# Sube la app web al VPS: https://laspinchisalitas.tech/proyectos/appcomidas/
# Uso: ./subir-al-vps.sh      (necesita el host "pinchis" de ~/.ssh/config)
set -euo pipefail
cd "$(dirname "$0")"

DESTINO="pinchis:/var/www/pinchis/proyectos/appcomidas/"
ssh pinchis 'mkdir -p /var/www/pinchis/proyectos/appcomidas'

rsync -rltv --delete \
  --exclude '.git' --exclude '.claude' --exclude 'android' --exclude 'tests' --exclude '.github' \
  --exclude 'node_modules' --exclude 'ia' --exclude 'server.js' --exclude 'package.json' --exclude 'README.md' \
  --exclude 'Iniciar app.command' --exclude 'subir-al-vps.sh' --exclude '.gitignore' --exclude '.DS_Store' \
  --exclude '*.apk' --exclude 'version.json' \
  ./ "$DESTINO"

ssh pinchis 'chown -R www-data:www-data /var/www/pinchis/proyectos/appcomidas'

# Servicio de IA: vive fuera del web root (nadie puede descargar su código) y corre con systemd.
ssh pinchis 'mkdir -p /opt/appcomidas-ia'
rsync -rltv --delete --exclude 'node_modules' ia/ pinchis:/opt/appcomidas-ia/ia/
rsync -rltv --delete --exclude 'vistas' --exclude 'app.js' --exclude 'ia.js' --exclude 'store.js' --exclude 'tema.js' --exclude 'iconos.js' --exclude 'util.js' --exclude 'planner.js' --exclude 'similares.js' js/ pinchis:/opt/appcomidas-ia/js/
# Dependencias del servidor (web-push) y llaves VAPID de las notificaciones (se generan una sola vez)
ssh pinchis 'cd /opt/appcomidas-ia/ia && npm ci --omit=dev --no-audit --no-fund --loglevel=error \
  && if [ ! -s /etc/appcomidas/push.env ]; then mkdir -p /etc/appcomidas && node -e "const w=require(\"/opt/appcomidas-ia/ia/node_modules/web-push\");const k=w.generateVAPIDKeys();console.log(\"VAPID_PUBLIC_KEY=\"+k.publicKey);console.log(\"VAPID_PRIVATE_KEY=\"+k.privateKey);console.log(\"VAPID_SUBJECT=https://laspinchisalitas.tech\")" > /etc/appcomidas/push.env && chmod 600 /etc/appcomidas/push.env && echo "llaves VAPID generadas"; fi'
ssh pinchis 'chown -R root:root /opt/appcomidas-ia && chmod -R a+rX /opt/appcomidas-ia \
  && cp /opt/appcomidas-ia/ia/appcomidas-ia.service /etc/systemd/system/appcomidas-ia.service \
  && systemctl daemon-reload && systemctl enable --now appcomidas-ia >/dev/null 2>&1; systemctl restart appcomidas-ia \
  && sleep 1 && systemctl is-active appcomidas-ia'
echo
echo "Listo: https://laspinchisalitas.tech/proyectos/appcomidas/"
