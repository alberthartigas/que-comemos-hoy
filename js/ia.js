// Cliente de la IA. Habla con /api/ia/ del mismo sitio (en el VPS, nginx lo manda al servicio;
// en local, server.js lo atiende si tiene GROQ_API_KEY). La app nunca ve la clave.

const BASE = new URL('api/ia/', document.baseURI);
let estadoPromesa = null;

/** { disponible: boolean }. Se consulta una vez por sesión. */
export function estadoIA() {
  if (!estadoPromesa) {
    estadoPromesa = fetch(new URL('estado', BASE), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { disponible: false }))
      .catch(() => ({ disponible: false }));
  }
  return estadoPromesa;
}

async function pedir(ruta, datos) {
  let respuesta;
  try {
    respuesta = await fetch(new URL(ruta, BASE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
  } catch {
    throw new Error('No hay conexión con el servidor de IA. Revisa tu internet.');
  }
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(cuerpo.error || (respuesta.status === 429 ? 'Muchas peticiones seguidas; espera un momento.' : 'La IA no pudo responder.'));
  }
  return cuerpo;
}

/** Receta a partir de un enlace de TikTok (y un nombre opcional que ayude). */
export const recetaDesdeTikTok = (url, nombre = '') => pedir('receta-tiktok', { url, nombre });

/** Tres variantes del mismo estilo que `receta`, evitando los nombres en `existentes`. */
export const variantesDe = (receta, existentes = []) => pedir('variantes', { receta, existentes });
