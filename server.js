// Servidor local sin dependencias: sirve la app a esta computadora y a los celulares del mismo Wi-Fi.
// Uso: npm start   (o PORT=8081 npm start)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const PUERTO = Number(process.env.PORT) || 8080;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
const PUBLICOS = new Set(['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'data', 'icons']);

function direccionesWifi() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((red) => red && red.family === 'IPv4' && !red.internal)
    .map((red) => `http://${red.address}:${PUERTO}`);
}

function responder(res, estado, cuerpo, tipo = 'text/plain; charset=utf-8') {
  res.writeHead(estado, { 'Content-Type': tipo, 'Cache-Control': 'no-cache' });
  res.end(cuerpo);
}

const servidor = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, 'Método no permitido');

  let ruta;
  try {
    ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return responder(res, 400, 'Dirección inválida');
  }

  if (ruta === '/api/red') {
    return responder(res, 200, JSON.stringify({ urls: direccionesWifi() }), TIPOS['.json']);
  }

  if (ruta === '/') ruta = '/index.html';
  const archivo = normalize(join(RAIZ, ruta));
  const primerNivel = ruta.split('/').filter(Boolean)[0];
  if (!archivo.startsWith(RAIZ.endsWith(sep) ? RAIZ : RAIZ + sep) || !PUBLICOS.has(primerNivel)) {
    return responder(res, 404, 'No encontrado');
  }

  try {
    const contenido = await readFile(archivo);
    responder(res, 200, req.method === 'HEAD' ? undefined : contenido, TIPOS[extname(archivo)] ?? 'application/octet-stream');
  } catch {
    responder(res, 404, 'No encontrado');
  }
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n  El puerto ${PUERTO} ya está ocupado. Prueba con otro:  PORT=8081 npm start\n`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

servidor.listen(PUERTO, '0.0.0.0', () => {
  const wifi = direccionesWifi();
  console.log('\n  🍽️  ¿Qué comemos hoy? está corriendo\n');
  console.log(`  En esta computadora:          http://localhost:${PUERTO}`);
  for (const url of wifi) console.log(`  En tu celular (mismo Wi-Fi):  ${url}`);
  if (!wifi.length) console.log('  (No encontré red Wi-Fi: conecta la computadora para abrirla desde el celular)');
  console.log('\n  Para detenerlo presiona Ctrl + C\n');
});
