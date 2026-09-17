// Piezas que comparten varias pantallas.

import { claveFecha, desdeClave, diasDeSemana, diasParaAgregar, fechaLarga, nombreDia, nombreDiaCorto } from '../fechas.js';
import { INFO_TIPO, TIPOS, tiposActivos } from '../horarios.js';
import { OMITIDA } from '../planner.js';
import { estadoIA } from '../ia.js';
import { ICONOS } from '../iconos.js';
import { alternarActiva, alternarFavorita, obtenerEstado, omitirComida, otraOpcion, usarRecetaEn } from '../store.js';
import { busquedaTikTok } from '../tiktok.js';
import { esc, toast } from '../util.js';
import { abrirElegirReceta } from './elegir-receta-hoja.js';
import { abrirHoja } from './hoja.js';

const descartadas = new Map(); // "fecha|tipo" → recetas que la persona ya cambió en esta sesión
let ultimoCambio = { clave: '', hora: 0 };

export const enlaceReceta = (id, fecha, tipo) =>
  `#/receta/${encodeURIComponent(id)}${fecha ? `?fecha=${fecha}&tipo=${tipo}` : ''}`;

export const enlaceTikTok = (receta) => receta.tiktok || busquedaTikTok(receta.nombre);

/** Botón "Otra opción" (usa data-fecha y data-tipo). */
export function accionOtraOpcion(boton) {
  const { fecha, tipo } = boton.dataset;
  const clave = `${fecha}|${tipo}`;
  const anterior = obtenerEstado().plan[fecha]?.[tipo];
  const vistas = descartadas.get(clave) ?? [];
  ultimoCambio = { clave, hora: Date.now() };
  const resultado = otraOpcion(fecha, tipo, vistas);
  if (!resultado.cambio) {
    toast(`No hay más opciones de ${INFO_TIPO[tipo].nombre.toLowerCase()}. Agrega más recetas.`);
    return;
  }
  if (anterior) descartadas.set(clave, [...vistas, anterior]);
  if (resultado.repetida) toast('Ya salieron todas esta semana: repetimos la que salió hace más tiempo.');
}

/** Clase para animar el emoji justo después de cambiar ese espacio. */
export function claseAnimacion(fecha, tipo) {
  return ultimoCambio.clave === `${fecha}|${tipo}` && Date.now() - ultimoCambio.hora < 1000 ? ' aparece' : '';
}

export function filaSlot({ receta, fecha, tipo, pasada = false, conAgregar = false, omitible = false, omitida = false }) {
  const info = INFO_TIPO[tipo];
  // Deslizar hacia la izquierda (o la × tenue con mouse) quita la comida de ese día; el envoltorio muestra "Quitar" detrás.
  const puedeQuitar = omitible && !pasada && receta;
  const atributos = puedeQuitar ? ` data-omitible data-fecha="${fecha}" data-tipo="${tipo}"` : '';
  const botonQuitar = puedeQuitar ? `<button class="slot__quitar" type="button" data-accion="omitir" data-fecha="${fecha}" data-tipo="${tipo}" aria-label="Quitar ${info.nombre.toLowerCase()} de este día">${ICONOS.cerrar}</button>` : '';
  const envolver = (html) => (puedeQuitar ? `<div class="slot-envoltura">${html}</div>` : html);
  const botonPropia = conAgregar && !pasada && receta
    ? `<button class="btn btn--icono" type="button" data-accion="agregar-propia" data-fecha="${fecha}" data-tipo="${tipo}" title="Agregar propia receta" aria-label="Agregar propia receta de ${info.nombre.toLowerCase()}">${ICONOS.mas}</button>`
    : '';

  if (!receta) {
    // Espacio en blanco (sin receta o quitada): siempre se puede volver a llenar tocándolo.
    if (pasada) {
      return `<div class="slot slot--${tipo} slot--vacia slot--pasada">
        <span class="slot__receta"><span class="emoji-caja">${info.emoji}</span><span class="slot__texto"><small>${info.nombre}</small><strong>Sin registro</strong></span></span>
      </div>`;
    }
    return `<div class="slot slot--${tipo} slot--vacia${omitida ? ' slot--omitida' : ''}">
      <button class="slot__receta" type="button" data-accion="elegir" data-fecha="${fecha}" data-tipo="${tipo}" aria-label="Agregar ${info.nombre.toLowerCase()}">
        <span class="emoji-caja">${info.emoji}</span>
        <span class="slot__texto"><small>${info.nombre}</small><strong>${omitida ? 'Sin planear · toca para agregar' : 'Sin receta · toca para agregar'}</strong></span>
        <span class="slot__mas">${ICONOS.mas}</span>
      </button>
    </div>`;
  }
  return envolver(`<div class="slot slot--${tipo}${pasada ? ' slot--pasada' : ''}"${atributos}>
    <a class="slot__receta" href="${enlaceReceta(receta.id, fecha, tipo)}">
      <span class="emoji-caja${claseAnimacion(fecha, tipo)}">${esc(receta.emoji)}</span>
      <span class="slot__texto">
        <small>${info.emoji} ${info.nombre}${receta.minutos ? ` · ${receta.minutos} min` : ''}</small>
        <strong>${esc(receta.nombre)}</strong>
      </span>
    </a>
    ${pasada ? '' : `<button class="btn btn--icono" type="button" data-accion="otra" data-fecha="${fecha}" data-tipo="${tipo}" title="Otra opción" aria-label="Otra opción de ${info.nombre.toLowerCase()}">${ICONOS.aleatorio}</button>`}
    ${botonPropia}${botonQuitar}
  </div>`);
}

/** Comidas que la persona hace al día (las quitadas de un día se muestran como espacio para agregar). */
export const comidasDelDia = (estado) => tiposActivos(estado.ajustes);

export const estaOmitida = (estado, fecha, tipo) => estado.plan[fecha]?.[tipo] === OMITIDA;

/** Filas de las comidas de un día. */
export function filasDelDia({ estado, fecha, hoy, conAgregar = false }) {
  const porId = new Map(estado.recetas.map((r) => [r.id, r]));
  return comidasDelDia(estado).map((tipo) => filaSlot({
    receta: porId.get(estado.plan[fecha]?.[tipo]), fecha, tipo, pasada: fecha < hoy, conAgregar, omitible: true, omitida: estaOmitida(estado, fecha, tipo),
  })).join('');
}

export const accionOmitir = (boton) => omitirComida(boton.dataset.fecha, boton.dataset.tipo);
export const accionElegir = (boton) => abrirElegirReceta({ fecha: boton.dataset.fecha, tipo: boton.dataset.tipo });

/** Lista compacta de recetas con corazón para marcar favoritas. */
export function listaMini(recetas) {
  return `<ul class="lista-recetas lista-recetas--mini">${recetas.map((r) => `<li>
    <div class="receta-item${r.activa ? '' : ' receta-item--inactiva'}">
      <a class="receta-item__enlace" href="#/receta/${encodeURIComponent(r.id)}">
        <span class="emoji-caja">${esc(r.emoji)}</span>
        <span class="receta-item__texto">
          <strong>${esc(r.nombre)}</strong>
          <small>${r.tipos.map((t) => INFO_TIPO[t].nombre).join(' · ')}${r.minutos ? ` · ${r.minutos} min` : ''}${r.activa ? '' : ' · pausada'}</small>
        </span>
      </a>
      ${botonFavorita(r)}
    </div>
  </li>`).join('')}</ul>`;
}

export function botonFavorita(receta) {
  return `<button class="btn btn--icono${receta.favorita ? ' activo' : ''}" type="button" data-accion="favorita" data-id="${esc(receta.id)}" aria-pressed="${receta.favorita}" aria-label="${receta.favorita ? 'Quitar de favoritas' : 'Marcar como favorita'}">${ICONOS.corazon}</button>`;
}

/** Acción compartida: alterna la favorita del botón (data-id). */
export function accionFavorita(boton) {
  const receta = obtenerEstado().recetas.find((r) => r.id === boton.dataset.id);
  if (!receta) return;
  alternarFavorita(receta.id);
  toast(receta.favorita ? 'Quitada de favoritas' : '❤️ Favorita: el sorteo te dará más de este estilo');
}

export function stepperPersonas(campo, etiqueta, valor, minimo) {
  return `<div class="stepper">
    <span class="stepper__etiqueta">${etiqueta}<output>${valor}</output></span>
    <span class="stepper__botones">
      <button type="button" data-accion="menos" data-campo="${campo}" aria-label="Quitar ${etiqueta.toLowerCase()}" ${valor <= minimo ? 'disabled' : ''}>${ICONOS.menos}</button>
      <button type="button" data-accion="mas" data-campo="${campo}" aria-label="Agregar ${etiqueta.toLowerCase()}" ${valor >= 20 ? 'disabled' : ''}>${ICONOS.mas}</button>
    </span>
  </div>`;
}

export function regresar(ctx, respaldo) {
  if (history.length > 1) history.back();
  else ctx.navegar(respaldo, { reemplazar: true });
}

/** Las secciones [data-seccion-ia] nacen ocultas y se muestran solo si el servidor tiene IA. */
export function mostrarSeccionesIA(raiz) {
  estadoIA().then((estado) => {
    if (!estado.disponible) return;
    for (const seccion of raiz.querySelectorAll('[data-seccion-ia]')) seccion.hidden = false;
  });
}

/** Botón "Agregar a…" (calendario) para una receta; la acción compartida es accionAgregarA. */
export function botonAgregarA(receta) {
  return `<button class="btn btn--icono" type="button" data-accion="agregar-a" data-id="${esc(receta.id)}" aria-label="Agregar ${esc(receta.nombre)} al calendario">${ICONOS.calendario}</button>`;
}

export function accionAgregarA(boton, ctx) {
  const receta = obtenerEstado().recetas.find((r) => r.id === boton.dataset.id);
  if (!receta) return;
  abrirSelectorCalendario(receta, { fecha: ctx?.params?.get('fecha'), tipo: ctx?.params?.get('tipo') });
}

/**
 * Hoja inferior para elegir día (lo que queda de esta semana y la próxima) y comida.
 * Al confirmar pone la receta en ese espacio del plan (si ya había otra, la reemplaza).
 */
export function abrirSelectorCalendario(receta, { fecha, tipo } = {}) {
  const hoy = claveFecha();
  const { estaSemana, proximaSemana } = diasParaAgregar(hoy);
  const fechaInicial = fecha && fecha >= hoy && [...estaSemana, ...proximaSemana].includes(fecha) ? fecha : hoy;
  const tipoInicial = TIPOS.includes(tipo) ? tipo : receta.tipos[0] ?? 'comida';

  const chipDia = (dia) => `<label class="opcion opcion--dia"><input type="radio" name="fecha" value="${dia}"${dia === fechaInicial ? ' checked' : ''}><span><small>${nombreDiaCorto(dia)}</small><strong>${desdeClave(dia).getDate()}</strong></span></label>`;
  const hoja = abrirHoja(`<form method="dialog" class="hoja__contenido" aria-label="Agregar al calendario">
    <span class="hoja__asa"></span>
    <h2>📅 Agregar al calendario</h2>
    <p class="hoja__receta"><span class="emoji-caja">${esc(receta.emoji)}</span><strong>${esc(receta.nombre)}</strong></p>
    <p class="campo__titulo">¿Qué día?</p>
    <p class="nota">Esta semana</p>
    <div class="opciones">${estaSemana.map(chipDia).join('')}</div>
    <p class="nota">Próxima semana</p>
    <div class="opciones">${proximaSemana.map(chipDia).join('')}</div>
    <p class="campo__titulo">¿En cuál comida?</p>
    <div class="opciones">${TIPOS.map((t) => `<label class="opcion"><input type="radio" name="tipo" value="${t}"${t === tipoInicial ? ' checked' : ''}><span>${INFO_TIPO[t].emoji} ${INFO_TIPO[t].nombre}</span></label>`).join('')}</div>
    <div class="fila-botones">
      <button class="btn" type="button" data-cerrar>Cancelar</button>
      <button class="btn btn--primario" type="submit">Agregar</button>
    </div>
  </form>`);

  const form = hoja.querySelector('form');
  hoja.onsubmit = (evento) => {
    const datos = new FormData(form);
    const dia = datos.get('fecha');
    const comida = datos.get('tipo');
    if (!dia || !comida) {
      evento.preventDefault();
      return;
    }
    if (!receta.activa) alternarActiva(receta.id);
    usarRecetaEn(dia, comida, receta.id);
    toast(`${receta.nombre} → ${nombreDia(dia)} ${desdeClave(dia).getDate()}, ${INFO_TIPO[comida].nombre.toLowerCase()}`);
  };
}

/**
 * Calendario de una semana (lunes a domingo): tira de 7 días con los emojis de sus tres comidas y,
 * debajo, las comidas del día elegido. `lunes` es el inicio de la semana que se muestra.
 */
export function calendarioSemana({ estado, hoy, lunes, seleccionado, conAgregar = false }) {
  const porId = new Map(estado.recetas.map((r) => [r.id, r]));
  const dias = diasDeSemana(lunes ?? hoy);
  const sel = dias.includes(seleccionado) ? seleccionado : dias.includes(hoy) ? hoy : dias[0];
  const tira = dias.map((dia) => {
    const clases = ['cal-dia', dia === hoy && 'cal-dia--hoy', dia === sel && 'cal-dia--activo', dia < hoy && 'cal-dia--pasado'].filter(Boolean).join(' ');
    const emojis = tiposActivos(estado.ajustes).map((t) => porId.get(estado.plan[dia]?.[t])?.emoji ?? '·');
    return `<button class="${clases}" type="button" role="tab" aria-selected="${dia === sel}" data-accion="dia" data-fecha="${dia}" aria-label="${nombreDia(dia)} ${desdeClave(dia).getDate()}">
      <small>${nombreDiaCorto(dia)}</small><strong>${desdeClave(dia).getDate()}</strong>
      <span class="cal-dia__emojis">${emojis.map((e) => `<span>${esc(e)}</span>`).join('')}</span>
    </button>`;
  }).join('');
  return `<div class="calendario" aria-label="Calendario de la semana">
    <div class="cal-tira" role="tablist">${tira}</div>
    <p class="calendario__titulo">${fechaLarga(sel)}${sel === hoy ? ' · Hoy' : ''}</p>
    <div class="slots">
      ${filasDelDia({ estado, fecha: sel, hoy, conAgregar })}
    </div>
  </div>`;
}
