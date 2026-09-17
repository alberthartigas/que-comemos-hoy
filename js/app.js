// Arranque: rutas por hash, pintado de vistas y eventos delegados.

import { registrarVersionInstalada } from './actualizaciones.js';
import { claveFecha } from './fechas.js';
import { tipoSegunHora } from './horarios.js';
import { ICONOS } from './iconos.js';
import { errorDeGuardado, obtenerEstado, suscribir } from './store.js';
import { iniciarSincronizacionAvisos } from './push.js';
import { alCambiarTema, alternarTema, aplicarTema, temaEfectivo } from './tema.js';
import { toast } from './util.js';
import * as ajustes from './vistas/ajustes.js';
import * as compras from './vistas/compras.js';
import * as formulario from './vistas/formulario.js';
import * as hoy from './vistas/hoy.js';
import * as receta from './vistas/receta.js';
import * as recetas from './vistas/recetas.js';
import * as semana from './vistas/semana.js';
import { cerrarHoja } from './vistas/hoja.js';

const VISTAS = { hoy, semana, compras, recetas, receta, nueva: formulario, editar: formulario, ajustes };
const PESTANA_DE = { receta: 'recetas', nueva: 'recetas', editar: 'recetas' };
const ICONO_PESTANA = { hoy: ICONOS.sol, semana: ICONOS.calendario, compras: ICONOS.carrito, recetas: ICONOS.libro, ajustes: ICONOS.ajustes };
const MANEJADORES = { click: ['accion', 'acciones'], change: ['cambio', 'cambios'], input: ['entrada', 'entradas'], submit: ['envio', 'envios'] };

const raiz = document.getElementById('vista');
let actual = null;
let pintando = false;
let repintadoPendiente = false;
let hashPintado = null;

function leerRuta() {
  const [camino = '', consulta = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [nombre = 'semana', ...args] = camino.split('/').filter(Boolean).map((parte) => {
    try {
      return decodeURIComponent(parte);
    } catch {
      return parte;
    }
  });
  return { nombre: VISTAS[nombre] ? nombre : 'semana', args, params: new URLSearchParams(consulta) };
}

function navegar(hash, { reemplazar = false } = {}) {
  if (reemplazar) {
    history.replaceState(null, '', hash);
    pintar();
  } else {
    location.hash = hash;
  }
}

function pintar() {
  const ruta = leerRuta();
  const vista = VISTAS[ruta.nombre];
  const esNuevaRuta = location.hash !== hashPintado;
  // Las hojas (compras del día, agregar receta…) viven fuera de la vista: al cambiar de pantalla se cierran.
  if (esNuevaRuta) cerrarHoja();

  pintando = true;
  try {
    const ahora = new Date();
    // `preparar` puede completar el plan; los cambios que provoque ya salen en este pintado.
    vista.preparar?.({ ...ruta, ahora, estado: obtenerEstado() });
    const ctx = { ...ruta, ahora, estado: obtenerEstado(), navegar, repintar: pintar };
    raiz.innerHTML = vista.render(ctx);
    actual = { vista, ctx };
    vista.alMontar?.(raiz, ctx);
    // alMontar puede limpiar parámetros de la URL (replaceState): se toma la versión final.
    hashPintado = location.hash;
  } finally {
    pintando = false;
  }

  const pestana = PESTANA_DE[ruta.nombre] ?? ruta.nombre;
  for (const enlace of document.querySelectorAll('.tabbar a')) {
    if (enlace.dataset.pestana === pestana) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }
  if (esNuevaRuta) window.scrollTo(0, 0);
}

suscribir(() => {
  if (pintando || repintadoPendiente) return;
  repintadoPendiente = true;
  queueMicrotask(() => {
    repintadoPendiente = false;
    pintar();
  });
});

for (const [tipoEvento, [atributo, grupo]] of Object.entries(MANEJADORES)) {
  raiz.addEventListener(tipoEvento, (evento) => {
    const elemento = evento.target.closest(`[data-${atributo}]`);
    const manejador = elemento && actual?.vista[grupo]?.[elemento.dataset[atributo]];
    if (!manejador) return;
    if (tipoEvento === 'click' || tipoEvento === 'submit') evento.preventDefault();
    manejador(elemento, actual.ctx, evento);
  });
}

// Si cambia el momento del día (p. ej. de desayuno a comida) se vuelve a pintar solo.
function claveDelMomento() {
  const momento = tipoSegunHora(new Date(), obtenerEstado().ajustes.horarios);
  return `${claveFecha()}|${momento.fecha}|${momento.tipo}|${momento.estado}`;
}
let momentoPintado = claveDelMomento();
function revisarHora() {
  const clave = claveDelMomento();
  if (clave === momentoPintado) return;
  momentoPintado = clave;
  if (['hoy', 'semana', 'compras'].includes(leerRuta().nombre)) pintar();
}
setInterval(revisarHora, 30_000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) revisarHora();
});

registrarVersionInstalada();
for (const enlace of document.querySelectorAll('.tabbar a')) {
  enlace.insertAdjacentHTML('afterbegin', ICONO_PESTANA[enlace.dataset.pestana]);
}
// Interruptor de modo claro/oscuro (arriba a la derecha en todas las pantallas)
const botonTema = document.getElementById('tema');
function pintarBotonTema() {
  const oscuro = temaEfectivo() === 'oscuro';
  botonTema.innerHTML = oscuro ? ICONOS.sol : ICONOS.luna;
  botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  botonTema.title = botonTema.getAttribute('aria-label');
}
botonTema.addEventListener('click', alternarTema);
alCambiarTema(pintarBotonTema);
aplicarTema();

window.addEventListener('hashchange', pintar);
if (!location.hash) history.replaceState(null, '', '#/semana');
pintar();

if (errorDeGuardado()) toast(errorDeGuardado());
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').then(() => iniciarSincronizacionAvisos()).catch(() => {});
}
