// Rutas HTTP de push: estado, suscribir, cancelar, probar. Mismo criterio de origen que la IA.

const CUERPO_MAXIMO = 64 * 1024;

function leerCuerpo(req) {
  return new Promise((resolver, rechazar) => {
    let total = 0;
    const partes = [];
    req.on('data', (parte) => {
      total += parte.length;
      if (total > CUERPO_MAXIMO) {
        rechazar(Object.assign(new Error('Petición demasiado grande.'), { estado: 413 }));
        req.destroy();
        return;
      }
      partes.push(parte);
    });
    req.on('end', () => {
      try {
        resolver(partes.length ? JSON.parse(Buffer.concat(partes).toString('utf8')) : {});
      } catch {
        rechazar(Object.assign(new Error('El cuerpo debe ser JSON.'), { estado: 400 }));
      }
    });
    req.on('error', rechazar);
  });
}

function responderJSON(res, estado, datos) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(datos));
}

function origenPermitido(req, origenes) {
  if (!origenes.length) return true;
  let origen = req.headers.origin ?? '';
  if (!origen && req.headers.referer) {
    try {
      origen = new URL(req.headers.referer).origin;
    } catch {
      origen = '';
    }
  }
  return origenes.includes(origen);
}

export function crearManejadorPush({ push, origenes = [] }) {
  return async function manejarPush(req, res, ruta) {
    if (ruta === 'estado') return responderJSON(res, 200, { disponible: push.disponible, clavePublica: push.clavePublica });
    if (!['suscribir', 'cancelar', 'probar'].includes(ruta)) return responderJSON(res, 404, { error: 'Ruta no encontrada.' });
    if (req.method !== 'POST') return responderJSON(res, 405, { error: 'Usa POST.' });
    if (!push.disponible) return responderJSON(res, 503, { error: 'Las notificaciones no están configuradas en este servidor.' });
    if (!origenPermitido(req, origenes)) return responderJSON(res, 403, { error: 'Origen no permitido.' });
    try {
      const cuerpo = await leerCuerpo(req);
      const resultado = ruta === 'suscribir' ? push.suscribir(cuerpo)
        : ruta === 'cancelar' ? push.cancelar(cuerpo.endpoint)
        : await push.probar(cuerpo.endpoint);
      return responderJSON(res, resultado.error ? resultado.estado ?? 400 : 200, resultado);
    } catch (error) {
      return responderJSON(res, error.estado ?? 500, { error: error.message || 'No se pudo procesar.' });
    }
  };
}
