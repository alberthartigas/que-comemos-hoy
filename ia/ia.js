// IA con Groq (API compatible con OpenAI). La clave vive SOLO en el servidor: este módulo corre en
// Node (ia/servidor.js en el VPS, server.js en local) y la app web le habla por /api/ia/.

import { TIPOS } from '../js/horarios.js';
import { UNIDADES, normalizarTexto } from '../js/porciones.js';
import { ETIQUETAS, sanearReceta } from '../js/recetas.js';

const URL_GROQ = 'https://api.groq.com/openai/v1/chat/completions';
export const MODELOS = (process.env.GROQ_MODELS || 'openai/gpt-oss-120b,openai/gpt-oss-20b,qwen/qwen3.8-27b').split(',');
const TIEMPO_MAXIMO_MS = 45_000;

const LIMITE_POR_IP_HORA = 20;
const LIMITE_GLOBAL_DIA = 400;
const CUERPO_MAXIMO = 64 * 1024;

const unidadesTexto = UNIDADES.map((u) => u.id).join(', ');

const SISTEMA = `Eres una cocinera mexicana experta en comida casera fácil, rápida y saludable.
Respondes ÚNICAMENTE con JSON válido, sin texto antes ni después.

Formato de una receta:
{"nombre": "texto (máximo 60 letras)", "emoji": "UN solo emoji de comida", "tipos": ["desayuno" y/o "comida" y/o "cena"], "minutos": entero, "etiquetas": [cero o más de: ${ETIQUETAS.map((e) => `"${e}"`).join(', ')}], "ingredientes": [{"nombre": "texto", "cantidad": número, "unidad": "una de: ${unidadesTexto}"}], "pasos": ["de 3 a 8 pasos cortos y claros"], "tip": "consejo corto opcional"}

Reglas:
- Las cantidades son para UNA persona adulta (la app las multiplica por la familia).
- Sal, pimienta, aceite y especias van con unidad "gusto" y cantidad 0.
- Usa "g" y "ml" para pesos y líquidos, "pza" para piezas enteras (huevo, jitomate, tortilla), "taza", "cda" y "cdita" para medidas de cocina.
- Español de México: jitomate, chícharos, ejotes, calabacita, aguacate.
- Recetas de máximo 40 minutos, con ingredientes fáciles de conseguir en México y sin marcas comerciales.
- Preparaciones saludables: poco aceite, sin freír en abundante aceite.`;

/** Saca el primer objeto JSON de un texto (tolera cercas de código y texto alrededor). */
export function extraerJSON(texto) {
  const limpio = String(texto ?? '').replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(limpio);
  } catch {
    // sigue buscando el primer objeto balanceado
  }
  const inicio = limpio.indexOf('{');
  if (inicio < 0) throw new Error('La IA no devolvió JSON.');
  let nivel = 0;
  let enCadena = false;
  for (let i = inicio; i < limpio.length; i++) {
    const c = limpio[i];
    if (enCadena) {
      if (c === '\\') i++;
      else if (c === '"') enCadena = false;
      continue;
    }
    if (c === '"') enCadena = true;
    else if (c === '{') nivel++;
    else if (c === '}' && --nivel === 0) return JSON.parse(limpio.slice(inicio, i + 1));
  }
  throw new Error('La IA devolvió un JSON incompleto.');
}

/** Llama a Groq probando los modelos en orden; devuelve el JSON que respondió el modelo. */
export async function completarJSON({ apiKey, usuario, sistema = SISTEMA, maxTokens = 2500, modelos = MODELOS, formatoJSON = true, temperatura = 0.7 }) {
  let ultimoError = null;
  for (const modelo of modelos) {
    const cuerpo = {
      model: modelo,
      messages: [{ role: 'system', content: sistema }, { role: 'user', content: usuario }],
      temperature: temperatura,
      max_tokens: maxTokens,
      ...(formatoJSON ? { response_format: { type: 'json_object' } } : {}),
      ...(modelo.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
    };
    let respuesta;
    try {
      respuesta = await fetch(URL_GROQ, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
      });
    } catch (error) {
      ultimoError = new Error(`No se pudo conectar con la IA (${modelo}).`);
      continue;
    }
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      const mensaje = datos?.error?.message ?? `HTTP ${respuesta.status}`;
      ultimoError = new Error(`La IA respondió con error (${modelo}): ${mensaje}`);
      // 401/403 son de la clave: no tiene caso probar otro modelo
      if (respuesta.status === 401 || respuesta.status === 403) break;
      continue;
    }
    const contenido = datos?.choices?.[0]?.message?.content ?? '';
    try {
      return { modelo, json: extraerJSON(contenido), contenido };
    } catch (error) {
      ultimoError = error;
    }
  }
  throw ultimoError ?? new Error('La IA no respondió.');
}

/** Título y autor del video de TikTok, vía su oEmbed público. Devuelve null si no se pudo. */
export async function infoTikTok(url) {
  try {
    const respuesta = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (que-comemos-hoy)' },
    });
    if (!respuesta.ok) return null;
    const datos = await respuesta.json();
    return { titulo: String(datos.title ?? '').slice(0, 600), autor: String(datos.author_name ?? '').slice(0, 80) };
  } catch {
    return null;
  }
}

const recetaCompacta = (r) => JSON.stringify({
  nombre: r.nombre, tipos: r.tipos, minutos: r.minutos, etiquetas: r.etiquetas,
  ingredientes: (r.ingredientes ?? []).map((i) => `${i.nombre} ${i.cantidad} ${i.unidad}`),
});

/** Limpia una receta que propuso la IA (sin id: el celular le pone uno al guardarla). */
function limpiarRecetaIA(bruta, extra = {}) {
  const { id: _id, ...receta } = sanearReceta({ ...bruta, id: 'ia', origen: 'propia', ...extra });
  if (!receta.tipos.length) receta.tipos = ['comida'];
  return receta;
}

export async function recetaDesdeTikTok({ url, nombre, apiKey }) {
  const info = await infoTikTok(url);
  if (!info && !nombre) throw Object.assign(new Error('No pude leer ese video. Escribe el nombre del platillo y vuelve a intentar.'), { estado: 422 });
  const usuario = [
    `Enlace de TikTok: ${url}`,
    info ? `Título o descripción del video: ${info.titulo || '(vacío)'}\nAutor: ${info.autor}` : 'No se pudo leer el video.',
    nombre ? `Nombre del platillo según la persona: ${nombre}` : '',
    'Escribe la receta completa del platillo que muestra el video, con el formato indicado.',
    'Si no puedes identificar ningún platillo, responde exactamente {"error": "No pude identificar el platillo"}.',
  ].filter(Boolean).join('\n');
  const { modelo, json } = await completarJSON({ apiKey, usuario });
  if (json.error) throw Object.assign(new Error(String(json.error)), { estado: 422 });
  return { receta: limpiarRecetaIA(json, { tiktok: url }), fuente: info, modelo };
}

/** Receta completa a partir del nombre del platillo (y el momento del día en que se va a servir). */
export async function recetaDesdeNombre({ nombre, tipo, apiKey }) {
  const usuario = [
    `Platillo: ${nombre}`,
    TIPOS.includes(tipo) ? `Se va a servir de ${tipo}: incluye "${tipo}" en "tipos".` : '',
    'Escribe la receta casera completa de ese platillo con el formato indicado.',
    'Si el texto no es un platillo reconocible, responde exactamente {"error": "No reconozco ese platillo; escribe el nombre de una comida"}.',
  ].filter(Boolean).join('\n');
  const { modelo, json } = await completarJSON({ apiKey, usuario });
  if (json.error) throw Object.assign(new Error(String(json.error)), { estado: 422 });
  const receta = limpiarRecetaIA(json);
  if (TIPOS.includes(tipo) && !receta.tipos.includes(tipo)) receta.tipos.push(tipo);
  return { receta, modelo };
}

const PATRON_VIDEO = /https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i;
const UA_NAVEGADOR = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

// Buscadores. Serper (google.serper.dev) y Brave (api.search.brave.com) tienen plan gratuito y
// necesitan clave (SERPER_API_KEY / BRAVE_API_KEY en /etc/appcomidas/ia.env). Bing RSS va sin clave
// pero casi nunca devuelve resultados desde un servidor; se intenta al final por si acaso.
async function buscarConSerper(consulta, clave) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST', headers: { 'X-API-KEY': clave, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: consulta, gl: 'mx', hl: 'es', num: 10 }), signal: AbortSignal.timeout(12_000),
  });
  if (!r.ok) throw new Error(`Serper ${r.status}`);
  const datos = await r.json();
  return (datos.organic ?? []).map((o) => o.link);
}
async function buscarConBrave(consulta, clave) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(consulta)}&count=10&country=MX&search_lang=es`;
  const r = await fetch(url, { headers: { Accept: 'application/json', 'X-Subscription-Token': clave }, signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(`Brave ${r.status}`);
  const datos = await r.json();
  return (datos.web?.results ?? []).map((o) => o.url);
}
async function buscarEnBing(consulta) {
  const r = await fetch(`https://www.bing.com/search?format=rss&q=${encodeURIComponent(consulta)}`, { headers: { 'User-Agent': UA_NAVEGADOR }, signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(`Bing ${r.status}`);
  return [...(await r.text()).matchAll(new RegExp(PATRON_VIDEO.source, 'gi'))].map((m) => m[0]);
}

/**
 * Busca un video de TikTok con la receta y lo verifica con el oEmbed de TikTok (que exista y que su
 * título hable del platillo). Devuelve { url, titulo, autor } o { url: null, motivo }.
 */
export async function buscarVideoTikTok({ nombre, busqueda = {} }) {
  const consulta = `site:tiktok.com receta ${nombre}`;
  const proveedores = [
    busqueda.serper && (() => buscarConSerper(consulta, busqueda.serper)),
    busqueda.brave && (() => buscarConBrave(consulta, busqueda.brave)),
    () => buscarEnBing(consulta),
  ].filter(Boolean);
  const candidatos = new Set();
  const fallas = [];
  for (const buscar of proveedores) {
    try {
      for (const enlace of await buscar()) {
        const m = String(enlace).match(PATRON_VIDEO);
        if (m) candidatos.add(m[0]);
      }
    } catch (error) {
      fallas.push(error.message);
    }
    if (candidatos.size >= 3) break;
  }
  const palabras = normalizarTexto(nombre).split(' ').filter((p) => p.length > 3);
  let primero = null;
  for (const url of [...candidatos].slice(0, 6)) {
    const info = await infoTikTok(url);
    if (!info) continue;
    const titulo = normalizarTexto(info.titulo);
    if (palabras.some((p) => titulo.includes(p))) return { url, ...info };
    primero ??= { url, ...info };
  }
  if (primero) return primero;
  const sinBuscador = !busqueda.serper && !busqueda.brave;
  return { url: null, motivo: sinBuscador ? 'Sin buscador configurado (SERPER_API_KEY o BRAVE_API_KEY).' : fallas[0] ?? 'No se encontró un video verificado.' };
}

export async function variantesDeReceta({ receta, existentes = [], cuantas = 3, apiKey }) {
  const usuario = [
    `Receta base: ${recetaCompacta(receta)}`,
    `Dame ${cuantas} variantes del MISMO ESTILO (misma técnica y tiempo parecido, ingredientes similares) pero que sean platillos DISTINTOS entre sí y distintos a la receta base.`,
    existentes.length ? `No repitas estos platillos que ya existen: ${existentes.slice(0, 80).join('; ')}.` : '',
    `Cada variante con el formato completo de receta. Responde {"variantes": [receta, receta, receta]}.`,
  ].filter(Boolean).join('\n');
  const { modelo, json } = await completarJSON({ apiKey, usuario, maxTokens: 4000 });
  const lista = Array.isArray(json.variantes) ? json.variantes : [];
  if (!lista.length) throw new Error('La IA no propuso variantes; intenta de nuevo.');
  return { variantes: lista.slice(0, cuantas).map((v) => limpiarRecetaIA(v)), modelo };
}

// ---------- Manejador HTTP: /estado, /receta-tiktok, /variantes ----------

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

/**
 * Crea el manejador. `ruta` llega sin prefijo ("estado", "receta-tiktok", "variantes").
 * `origenes`: orígenes permitidos (vacío = no se revisa, para desarrollo local).
 */
export function crearManejadorIA({ apiKey, origenes = [], busqueda = {} }) {
  const porIp = new Map();
  let usoDia = { dia: '', n: 0 };

  function limitar(req) {
    const ip = req.headers['x-real-ip'] || req.socket.remoteAddress || '?';
    const ahora = Date.now();
    const registro = porIp.get(ip) ?? { inicio: ahora, n: 0 };
    if (ahora - registro.inicio > 3_600_000) Object.assign(registro, { inicio: ahora, n: 0 });
    registro.n++;
    porIp.set(ip, registro);
    if (porIp.size > 5000) porIp.clear();
    const hoy = new Date().toISOString().slice(0, 10);
    if (usoDia.dia !== hoy) usoDia = { dia: hoy, n: 0 };
    usoDia.n++;
    if (registro.n > LIMITE_POR_IP_HORA) return 'Ya usaste muchas veces la IA en la última hora; espera un rato.';
    if (usoDia.n > LIMITE_GLOBAL_DIA) return 'La IA llegó a su límite de hoy; mañana vuelve a estar disponible.';
    return null;
  }

  function origenPermitido(req) {
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

  return async function manejarIA(req, res, ruta) {
    if (ruta === 'estado') return responderJSON(res, 200, { disponible: Boolean(apiKey), modelos: apiKey ? MODELOS : [] });
    if (!['receta-tiktok', 'receta-nombre', 'buscar-tiktok', 'variantes'].includes(ruta)) return responderJSON(res, 404, { error: 'Ruta no encontrada.' });
    if (req.method !== 'POST') return responderJSON(res, 405, { error: 'Usa POST.' });
    if (!apiKey) return responderJSON(res, 503, { error: 'La IA no está configurada en este servidor.' });
    if (!origenPermitido(req)) return responderJSON(res, 403, { error: 'Origen no permitido.' });
    const limite = limitar(req);
    if (limite) return responderJSON(res, 429, { error: limite });

    try {
      const cuerpo = await leerCuerpo(req);
      if (ruta === 'receta-tiktok') {
        const url = String(cuerpo.url ?? '').trim().slice(0, 500);
        if (!/^https:\/\/([a-z0-9-]+\.)*tiktok\.com\//i.test(url)) return responderJSON(res, 400, { error: 'Pega un enlace de tiktok.com.' });
        const nombre = String(cuerpo.nombre ?? '').trim().slice(0, 80);
        return responderJSON(res, 200, await recetaDesdeTikTok({ url, nombre, apiKey }));
      }
      if (ruta === 'receta-nombre' || ruta === 'buscar-tiktok') {
        const nombre = String(cuerpo.nombre ?? '').trim().slice(0, 80);
        if (nombre.length < 3) return responderJSON(res, 400, { error: 'Escribe el nombre del platillo.' });
        if (ruta === 'receta-nombre') return responderJSON(res, 200, await recetaDesdeNombre({ nombre, tipo: String(cuerpo.tipo ?? ''), apiKey }));
        return responderJSON(res, 200, await buscarVideoTikTok({ nombre, busqueda }));
      }
      const receta = cuerpo.receta && typeof cuerpo.receta === 'object' ? sanearReceta({ ...cuerpo.receta, id: 'base' }) : null;
      if (!receta || !receta.ingredientes.length) return responderJSON(res, 400, { error: 'Falta la receta base.' });
      const existentes = Array.isArray(cuerpo.existentes) ? cuerpo.existentes.map((n) => String(n).slice(0, 80)) : [];
      return responderJSON(res, 200, await variantesDeReceta({ receta, existentes, apiKey }));
    } catch (error) {
      const estado = error.estado ?? 502;
      if (estado >= 500) console.error(`[ia] ${ruta}:`, error.message);
      return responderJSON(res, estado, { error: error.message || 'La IA no pudo responder.' });
    }
  };
}
