// Notificaciones push (Web Push con VAPID). Cada celular se suscribe y manda sus horas de aviso,
// su zona horaria y el plan de la semana (solo nombres de platillos). Cada minuto se revisa a quién
// le toca aviso y se le manda "Hoy de comida: Tinga de pollo". Sin Firebase ni cuentas: funciona en
// Android (APK o Chrome) y en iPhone con la app agregada a inicio.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const TIPOS = ['desayuno', 'comida', 'cena'];
const INFO = {
  desayuno: { nombre: 'Desayuno', emoji: '☀️' },
  comida: { nombre: 'Comida', emoji: '🍲' },
  cena: { nombre: 'Cena', emoji: '🌙' },
};
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_SUSCRIPCIONES = 2000;

/** Fecha (YYYY-MM-DD) y hora (HH:MM) locales de un instante en una zona horaria IANA. */
export function horaLocal(instante, zona) {
  let partes;
  try {
    partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(instante);
  } catch {
    return horaLocal(instante, 'America/Mexico_City');
  }
  const v = Object.fromEntries(partes.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  return { fecha: `${v.year}-${v.month}-${v.day}`, hhmm: `${v.hour === '24' ? '00' : v.hour}:${v.minute}` };
}

/** Qué avisos le tocan a una suscripción en este minuto (sin repetir el mismo día). */
export function avisosPendientes(sub, instante = new Date()) {
  const { fecha, hhmm } = horaLocal(instante, sub.zona);
  return TIPOS.filter((tipo) => HORA.test(sub.avisos?.[tipo] ?? '') && sub.avisos[tipo] === hhmm && sub.enviados?.[tipo] !== fecha && sub.plan?.[fecha]?.[tipo] !== null)
    .map((tipo) => ({ tipo, fecha }));
}

/** Texto de la notificación para (tipo, fecha) según el plan que mandó el celular. */
export function mensajeAviso(sub, tipo, fecha) {
  const info = INFO[tipo];
  const platillo = sub.plan?.[fecha]?.[tipo];
  return {
    titulo: `${info.emoji} ${info.nombre} de hoy`,
    cuerpo: platillo ? `${platillo}. Toca para ver la receta.` : 'Abre la app para ver qué toca hoy.',
    url: `${sub.url ?? ''}#/hoy`,
    etiqueta: `aviso-${tipo}`,
  };
}

/** Limpia lo que manda el celular; devuelve null si no sirve. */
export function sanearSuscripcion(datos, urlApp) {
  const s = datos?.suscripcion;
  if (!s || typeof s.endpoint !== 'string' || !/^https:\/\//.test(s.endpoint) || s.endpoint.length > 1000) return null;
  if (!s.keys?.p256dh || !s.keys?.auth) return null;
  const avisos = {};
  for (const tipo of TIPOS) {
    const hora = datos.avisos?.[tipo];
    avisos[tipo] = typeof hora === 'string' && HORA.test(hora) ? hora : null;
  }
  const plan = {};
  for (const [fecha, dia] of Object.entries(datos.plan ?? {}).slice(0, 14)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !dia || typeof dia !== 'object') continue;
    // null = ese día la persona no hace esa comida: no se le avisa
    plan[fecha] = Object.fromEntries(TIPOS.filter((t) => typeof dia[t] === 'string' || dia[t] === null).map((t) => [t, dia[t] === null ? null : dia[t].slice(0, 80)]));
  }
  return {
    suscripcion: { endpoint: s.endpoint, keys: { p256dh: String(s.keys.p256dh).slice(0, 200), auth: String(s.keys.auth).slice(0, 100) } },
    avisos,
    zona: typeof datos.zona === 'string' && datos.zona.length <= 60 ? datos.zona : 'America/Mexico_City',
    plan,
    url: urlApp,
  };
}

export const idDe = (endpoint) => createHash('sha256').update(endpoint).digest('hex').slice(0, 24);

/**
 * Crea el servicio. `directorio`: dónde guardar suscripciones.json. `vapid`: { publica, privada, sujeto }.
 * Si falta web-push o las llaves, `disponible` es false y las rutas responden 503.
 */
export async function crearPush({ directorio, vapid, urlApp, log = console }) {
  let webpush = null;
  if (vapid?.publica && vapid?.privada) {
    try {
      webpush = (await import('web-push')).default;
      webpush.setVapidDetails(vapid.sujeto || urlApp, vapid.publica, vapid.privada);
    } catch (error) {
      log.error('[push] web-push no disponible:', error.message);
    }
  }
  const disponible = Boolean(webpush && directorio);
  const archivo = directorio ? join(directorio, 'suscripciones.json') : null;
  let suscripciones = new Map();
  let guardadoPendiente = null;

  async function cargar() {
    if (!archivo) return;
    try {
      const lista = JSON.parse(await readFile(archivo, 'utf8'));
      suscripciones = new Map(lista.map((s) => [idDe(s.suscripcion.endpoint), s]));
    } catch {
      suscripciones = new Map();
    }
  }
  function guardar() {
    if (!archivo || guardadoPendiente) return;
    guardadoPendiente = setTimeout(async () => {
      guardadoPendiente = null;
      try {
        await mkdir(directorio, { recursive: true });
        await writeFile(`${archivo}.tmp`, JSON.stringify([...suscripciones.values()]));
        await rename(`${archivo}.tmp`, archivo);
      } catch (error) {
        log.error('[push] no se pudo guardar:', error.message);
      }
    }, 500);
  }

  async function enviar(sub, mensaje) {
    try {
      await webpush.sendNotification(sub.suscripcion, JSON.stringify(mensaje), { TTL: 3600, urgency: 'normal' });
      return true;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        suscripciones.delete(idDe(sub.suscripcion.endpoint));
        guardar();
      } else {
        log.error('[push] envío falló:', error.statusCode ?? '', error.body ?? error.message);
      }
      return false;
    }
  }

  async function revisar(instante = new Date()) {
    let enviados = 0;
    for (const sub of suscripciones.values()) {
      for (const { tipo, fecha } of avisosPendientes(sub, instante)) {
        sub.enviados = { ...(sub.enviados ?? {}), [tipo]: fecha };
        guardar();
        if (await enviar(sub, mensajeAviso(sub, tipo, fecha))) enviados++;
      }
    }
    return enviados;
  }

  if (disponible) {
    await cargar();
    setInterval(() => revisar().catch((e) => log.error('[push] revisar:', e.message)), 60_000).unref();
    log.log(`[push] listo: ${suscripciones.size} suscripciones`);
  }

  return {
    disponible,
    clavePublica: vapid?.publica ?? '',
    cuantas: () => suscripciones.size,
    revisar,
    suscribir(datos) {
      const limpia = sanearSuscripcion(datos, urlApp);
      if (!limpia) return { error: 'Suscripción inválida.', estado: 400 };
      const id = idDe(limpia.suscripcion.endpoint);
      if (!suscripciones.has(id) && suscripciones.size >= MAX_SUSCRIPCIONES) return { error: 'Ya no caben más suscripciones.', estado: 507 };
      suscripciones.set(id, { ...limpia, enviados: suscripciones.get(id)?.enviados ?? {}, actualizada: new Date().toISOString() });
      guardar();
      return { ok: true };
    },
    cancelar(endpoint) {
      const habia = suscripciones.delete(idDe(String(endpoint ?? '')));
      if (habia) guardar();
      return { ok: true };
    },
    async probar(endpoint) {
      const sub = suscripciones.get(idDe(String(endpoint ?? '')));
      if (!sub) return { error: 'Primero activa los avisos.', estado: 404 };
      const hoy = horaLocal(new Date(), sub.zona).fecha;
      const proximo = TIPOS.find((t) => sub.plan?.[hoy]?.[t]) ?? 'comida';
      const ok = await enviar(sub, { ...mensajeAviso(sub, proximo, hoy), titulo: '🔔 Avisos activados', etiqueta: 'prueba' });
      return ok ? { ok: true } : { error: 'No se pudo enviar la notificación de prueba.', estado: 502 };
    },
  };
}
