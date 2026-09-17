// Avisos push en el celular. El servidor (ia/push.js) manda la notificación a la hora de cada comida
// con el platillo del día; para eso este módulo le sube la suscripción, las horas, la zona horaria
// y los nombres del plan de los próximos días cada vez que cambian.

import { claveFecha, sumarDias } from './fechas.js';
import { TIPOS, tiposActivos } from './horarios.js';
import { OMITIDA } from './planner.js';
import { actualizarAjustes, obtenerEstado, suscribir as alCambiarEstado } from './store.js';

const BASE = new URL('api/push/', document.baseURI);
const DIAS_A_SUBIR = 8;
let estadoPromesa = null;
let sincronizacionPendiente = null;
let ultimaFirma = '';

export const soportaPush = () =>
  window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** En iPhone las notificaciones solo existen con la app agregada a inicio (iOS 16.4+). */
export const esIphoneSinInstalar = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && navigator.standalone !== true;

export const permisoNotificaciones = () => ('Notification' in window ? Notification.permission : 'unsupported');

export function estadoPush() {
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
    respuesta = await fetch(new URL(ruta, BASE), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
  } catch {
    throw new Error('No hay conexión con el servidor. Revisa tu internet.');
  }
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(cuerpo.error || 'El servidor no pudo procesar los avisos.');
  return cuerpo;
}

function aBytes(base64url) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function suscripcionActual() {
  if (!soportaPush()) return null;
  const registro = await navigator.serviceWorker.ready;
  return registro.pushManager.getSubscription();
}

/** Nombres de los platillos de hoy y los próximos días (solo lo que el servidor necesita para el texto del aviso). */
function planParaServidor(estado) {
  const porId = new Map(estado.recetas.map((r) => [r.id, r.nombre]));
  const activas = tiposActivos(estado.ajustes);
  const hoy = claveFecha();
  const plan = {};
  for (let i = 0; i < DIAS_A_SUBIR; i++) {
    const fecha = sumarDias(hoy, i);
    const dia = estado.plan[fecha];
    if (!dia) continue;
    // null = ese día no hay esa comida (quitada): el servidor no manda aviso
    plan[fecha] = Object.fromEntries(TIPOS.map((t) => [t, !activas.includes(t) || dia[t] === OMITIDA ? null : porId.get(dia[t]) ?? undefined]).filter(([, v]) => v !== undefined));
  }
  return plan;
}

function datosParaServidor(sub, estado) {
  const { avisos } = estado.ajustes;
  return {
    suscripcion: sub.toJSON(),
    avisos: Object.fromEntries(TIPOS.map((t) => [t, tiposActivos(estado.ajustes).includes(t) ? avisos[t] ?? null : null])),
    zona: Intl.DateTimeFormat().resolvedOptions().timeZone,
    plan: planParaServidor(estado),
  };
}

async function sincronizar(sub = null) {
  const suscripcion = sub ?? (await suscripcionActual());
  if (!suscripcion) return;
  const datos = datosParaServidor(suscripcion, obtenerEstado());
  const firma = JSON.stringify(datos);
  if (firma === ultimaFirma) return;
  await pedir('suscribir', datos);
  ultimaFirma = firma;
}

export async function activarAvisos() {
  if (!soportaPush()) {
    throw new Error(esIphoneSinInstalar()
      ? 'En iPhone primero agrega la app a inicio (Compartir → Agregar a inicio) y ábrela desde ahí.'
      : 'Este navegador no soporta notificaciones.');
  }
  const estado = await estadoPush();
  if (!estado.disponible) throw new Error('El servidor aún no tiene configuradas las notificaciones.');
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('No se dio permiso para notificaciones.');
  const registro = await navigator.serviceWorker.ready;
  let sub = await registro.pushManager.getSubscription();
  if (!sub) sub = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(estado.clavePublica) });
  actualizarAjustes({ avisos: { ...obtenerEstado().ajustes.avisos, activos: true } });
  ultimaFirma = '';
  await sincronizar(sub);
}

export async function desactivarAvisos() {
  actualizarAjustes({ avisos: { ...obtenerEstado().ajustes.avisos, activos: false } });
  const sub = await suscripcionActual();
  if (!sub) return;
  await pedir('cancelar', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
  ultimaFirma = '';
}

export async function probarAviso() {
  const sub = await suscripcionActual();
  if (!sub) throw new Error('Primero activa los avisos.');
  await sincronizar(sub);
  await pedir('probar', { endpoint: sub.endpoint });
}

/** Al arrancar y cada vez que cambie el plan o las horas, resube los datos (con espera de 3 s). */
export function iniciarSincronizacionAvisos() {
  if (!soportaPush()) return;
  const programar = () => {
    if (!obtenerEstado().ajustes.avisos.activos) return;
    clearTimeout(sincronizacionPendiente);
    sincronizacionPendiente = setTimeout(() => sincronizar().catch(() => {}), 3000);
  };
  alCambiarEstado(programar);
  programar();
}
