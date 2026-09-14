// Piezas que comparten varias pantallas.

import { INFO_TIPO } from '../horarios.js';
import { estadoIA } from '../ia.js';
import { ICONOS } from '../iconos.js';
import { alternarFavorita, obtenerEstado, otraOpcion } from '../store.js';
import { busquedaTikTok } from '../tiktok.js';
import { esc, toast } from '../util.js';

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

export function filaSlot({ receta, fecha, tipo, pasada = false }) {
  const info = INFO_TIPO[tipo];
  if (!receta) {
    return `<div class="slot slot--${tipo} slot--vacia">
      <a class="slot__receta" href="#/nueva?tipo=${tipo}">
        <span class="emoji-caja">${info.emoji}</span>
        <span class="slot__texto"><small>${info.nombre}</small><strong>${pasada ? 'Sin registro' : 'Sin recetas: agrega una'}</strong></span>
      </a>
    </div>`;
  }
  return `<div class="slot slot--${tipo}${pasada ? ' slot--pasada' : ''}">
    <a class="slot__receta" href="${enlaceReceta(receta.id, fecha, tipo)}">
      <span class="emoji-caja${claseAnimacion(fecha, tipo)}">${esc(receta.emoji)}</span>
      <span class="slot__texto">
        <small>${info.emoji} ${info.nombre}${receta.minutos ? ` · ${receta.minutos} min` : ''}</small>
        <strong>${esc(receta.nombre)}</strong>
      </span>
    </a>
    ${pasada ? '' : `<button class="btn btn--icono" type="button" data-accion="otra" data-fecha="${fecha}" data-tipo="${tipo}" aria-label="Otra opción de ${info.nombre.toLowerCase()}">${ICONOS.aleatorio}</button>`}
  </div>`;
}

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
