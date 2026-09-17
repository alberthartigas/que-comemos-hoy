// Servidor del VPS: IA (/ia/*) y notificaciones push (/push/*). Escucha solo en 127.0.0.1;
// nginx le pasa /proyectos/appcomidas/api/ → /. systemd le da las variables desde
// /etc/appcomidas/ia.env (GROQ_API_KEY) y /etc/appcomidas/push.env (VAPID_*).

import { createServer } from 'node:http';
import { crearManejadorIA } from './ia.js';
import { crearPush } from './push.js';
import { crearManejadorPush } from './push-http.js';

const PUERTO = Number(process.env.PORT) || 3070;
const URL_APP = process.env.URL_APP || 'https://laspinchisalitas.tech/proyectos/appcomidas/';
const origenes = (process.env.ORIGENES || 'https://laspinchisalitas.tech').split(',').map((o) => o.trim()).filter(Boolean);

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) console.error('Aviso: falta GROQ_API_KEY; la IA responderá "no disponible".');
// Buscador para los videos de TikTok (opcional): SERPER_API_KEY o BRAVE_API_KEY en /etc/appcomidas/ia.env
const busqueda = { serper: process.env.SERPER_API_KEY, brave: process.env.BRAVE_API_KEY };
const manejarIA = crearManejadorIA({ apiKey, origenes, busqueda });

const push = await crearPush({
  directorio: process.env.STATE_DIRECTORY || process.env.PUSH_DIR || '',
  vapid: { publica: process.env.VAPID_PUBLIC_KEY, privada: process.env.VAPID_PRIVATE_KEY, sujeto: process.env.VAPID_SUBJECT },
  urlApp: URL_APP,
});
const manejarPush = crearManejadorPush({ push, origenes });

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const ruta = url.pathname.replace(/\/+$/, '');
  if (ruta.startsWith('/ia/')) return manejarIA(req, res, ruta.slice('/ia/'.length));
  if (ruta.startsWith('/push/')) return manejarPush(req, res, ruta.slice('/push/'.length));
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end('{"error":"No encontrado."}');
}).listen(PUERTO, '127.0.0.1', () => {
  console.log(`¿Qué comemos hoy? · servidor en 127.0.0.1:${PUERTO} · IA: ${apiKey ? 'sí' : 'no'} · buscador de videos: ${busqueda.serper ? 'Serper' : busqueda.brave ? 'Brave' : 'no'} · push: ${push.disponible ? 'sí' : 'no'} · orígenes: ${origenes.join(', ')}`);
});
