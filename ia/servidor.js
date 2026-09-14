// Servidor de IA para el VPS. Escucha solo en 127.0.0.1; nginx le pasa /proyectos/appcomidas/api/ → /.
// systemd le da GROQ_API_KEY desde /etc/appcomidas/ia.env (ver ia/appcomidas-ia.service).

import { createServer } from 'node:http';
import { crearManejadorIA } from './ia.js';

const PUERTO = Number(process.env.PORT) || 3070;
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('Falta GROQ_API_KEY (¿está /etc/appcomidas/ia.env y el EnvironmentFile del servicio?)');
  process.exit(1);
}
const origenes = (process.env.ORIGENES || 'https://laspinchisalitas.tech').split(',').map((o) => o.trim()).filter(Boolean);
const manejar = crearManejadorIA({ apiKey, origenes });

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/ia/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end('{"error":"No encontrado."}');
  }
  await manejar(req, res, url.pathname.slice('/ia/'.length).replace(/\/+$/, ''));
}).listen(PUERTO, '127.0.0.1', () => {
  console.log(`IA de ¿Qué comemos hoy? en 127.0.0.1:${PUERTO} (orígenes: ${origenes.join(', ')})`);
});
