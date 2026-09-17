// Detalle: ingredientes escalados, mini receta y videos de TikTok.

import { claveFecha, fechaLarga } from '../fechas.js';
import { INFO_TIPO } from '../horarios.js';
import { variantesDe } from '../ia.js';
import { ICONOS } from '../iconos.js';
import { escalarIngredientes, porcionesTotales } from '../porciones.js';
import { recetasParecidas } from '../similares.js';
import { alternarActiva, guardarReceta, nuevoIdReceta } from '../store.js';
import { autorTikTok, esc, toast } from '../util.js';
import { abrirSelectorCalendario, accionAgregarA, accionFavorita, accionVideo, botonFavorita, listaMini, mostrarSeccionesIA, regresar, stepperPersonas } from './comun.js';

// Adultos y niños solo para esta receta (no cambia los ajustes de la casa).
let personas = null;

// Variantes que propuso la IA para la receta abierta.
let variantes = { id: null, lista: [], cargando: false, error: '' };

function seccionVariantes(receta) {
  const v = variantes.id === receta.id ? variantes : { lista: [], cargando: false, error: '' };
  const lista = v.lista.map((variante, i) => `<details class="variante">
    <summary><span class="emoji-caja">${esc(variante.emoji)}</span><span class="receta-item__texto"><strong>${esc(variante.nombre)}</strong><small>${variante.tipos.map((t) => INFO_TIPO[t].nombre).join(' · ')}${variante.minutos ? ` · ${variante.minutos} min` : ''} · ${variante.ingredientes.length} ingredientes</small></span></summary>
    <p class="nota">${variante.ingredientes.map((ing) => esc(ing.nombre)).join(', ')}.</p>
    <ol class="pasos">${variante.pasos.map((paso) => `<li><span>${esc(paso)}</span></li>`).join('')}</ol>
    ${variante.agregadaId
      ? `<a class="btn btn--verde btn--bloque" href="#/receta/${encodeURIComponent(variante.agregadaId)}">✅ Agregada: ver receta</a>`
      : `<button class="btn btn--primario btn--bloque" type="button" data-accion="agregar-variante" data-indice="${i}">${ICONOS.mas} Agregar a mis recetas</button>`}
  </details>`).join('');
  return `<section class="tarjeta tarjeta--ia" data-seccion-ia hidden>
    <h2>🤖 Variantes con IA</h2>
    <p class="nota">Platillos distintos pero del mismo estilo que esta receta. Los que te gusten los agregas a tu catálogo.</p>
    ${lista}
    ${v.error ? `<p class="aviso">${esc(v.error)}</p>` : ''}
    <button class="btn ${v.lista.length ? '' : 'btn--primario '}btn--bloque" type="button" data-accion="variantes"${v.cargando ? ' disabled' : ''}>${v.cargando ? '⏳ Pensando… tarda unos segundos' : v.lista.length ? '✨ Dame otras 3' : '✨ Dame 3 variantes'}</button>
  </section>`;
}

const recetaActual = ({ estado, args }) => estado.recetas.find((r) => r.id === args[0]);

function personasPara(receta, ajustes) {
  if (personas?.id !== receta.id) personas = { id: receta.id, adultos: ajustes.adultos, ninos: ajustes.ninos };
  return personas;
}

function avisoDelPlan(fecha, tipo, hoy) {
  const info = INFO_TIPO[tipo];
  if (!fecha || !info) return '';
  const cuando = fecha === hoy ? 'de hoy' : `del ${fechaLarga(fecha).toLowerCase()}`;
  return `<p class="aviso">Sugerida para ${info.articulo} ${info.nombre.toLowerCase()} ${cuando}.</p>`;
}

export function render(ctx) {
  const receta = recetaActual(ctx);
  if (!receta) {
    return `<div class="vacio">
      <span class="vacio__emoji">🤷</span>
      <p>Esta receta ya no existe.</p>
      <a class="btn btn--primario" href="#/recetas">Ver recetas</a>
    </div>`;
  }

  const { ajustes } = ctx.estado;
  const gente = personasPara(receta, ajustes);
  const porciones = porcionesTotales({ ...ajustes, adultos: gente.adultos, ninos: gente.ninos });
  const autor = autorTikTok(receta.tiktok);
  const parecidas = recetasParecidas(receta, ctx.estado.recetas);

  return `
    <div class="barra-superior">
      <button class="btn btn--icono" type="button" data-accion="volver" aria-label="Regresar">${ICONOS.atras}</button>
      <div>
        ${botonFavorita(receta)}
        <a class="btn btn--icono" href="#/editar/${encodeURIComponent(receta.id)}" aria-label="Editar receta">${ICONOS.lapiz}</a>
      </div>
    </div>

    <header class="detalle-cabecera">
      <span class="detalle-cabecera__emoji">${esc(receta.emoji)}</span>
      <h1>${esc(receta.nombre)}</h1>
      <p class="meta">
        ${receta.minutos ? `<span>${ICONOS.reloj} ${receta.minutos} min</span>` : ''}
        ${receta.tipos.map((t) => `<span class="chip chip--${t}">${INFO_TIPO[t].emoji} ${INFO_TIPO[t].nombre}</span>`).join('')}
      </p>
      ${receta.etiquetas.length ? `<div class="chips">${receta.etiquetas.map((e) => `<span class="chip chip--verde">${esc(e)}</span>`).join('')}</div>` : ''}
    </header>

    ${avisoDelPlan(ctx.params.get('fecha'), ctx.params.get('tipo'), claveFecha(ctx.ahora))}

    <section class="tarjeta">
      <h2>🎥 Video de la receta</h2>
      ${receta.tiktok ? `<button class="btn btn--tiktok btn--bloque" type="button" data-accion="video" data-id="${esc(receta.id)}">${ICONOS.play} Ver video${autor ? ` de ${esc(autor)}` : ''}</button>` : '<p class="nota">Esta receta todavía no tiene video.</p>'}
      <button class="btn btn--bloque" type="button" data-accion="video" data-id="${esc(receta.id)}" data-buscar="1">${ICONOS.buscar} ${receta.tiktok ? 'Buscar otro video' : 'Buscar un video'}</button>
      <p class="nota">Los videos se ven aquí mismo, sin salir de la app.</p>
    </section>

    <section class="tarjeta">
      <div class="tarjeta__cabecera">
        <h2>🛒 Ingredientes</h2>
        <span class="nota">${porciones} ${porciones === 1 ? 'porción' : 'porciones'}</span>
      </div>
      <div class="personas">
        ${stepperPersonas('adultos', 'Adultos', gente.adultos, gente.ninos ? 0 : 1)}
        ${stepperPersonas('ninos', 'Niños', gente.ninos, gente.adultos ? 0 : 1)}
      </div>
      <ul class="checklist">
        ${escalarIngredientes(receta.ingredientes, porciones).map((ing) => `<li><label class="check">
          <input type="checkbox">
          <span class="check__caja">${ICONOS.check}</span>
          <span class="check__nombre">${esc(ing.nombre)}</span>
          <span class="check__cantidad">${esc(ing.texto)}</span>
        </label></li>`).join('')}
      </ul>
      <p class="nota">Cantidades redondeadas hacia arriba. Cada niño come el ${Math.round(ajustes.factorNino * 100)}% de lo que come un adulto (puedes cambiarlo en Ajustes).</p>
    </section>

    <section class="tarjeta">
      <h2>👩‍🍳 Preparación</h2>
      <ol class="pasos">${receta.pasos.map((paso) => `<li><span>${esc(paso)}</span></li>`).join('')}</ol>
      ${receta.tip ? `<p class="tip">💡 ${esc(receta.tip)}</p>` : ''}
    </section>

    ${parecidas.length ? `<section class="tarjeta">
      <h2>✨ Parecidas a esta</h2>
      <p class="nota">Del mismo estilo, por sus ingredientes y etiquetas. Marca con ❤️ las que te gusten y el sorteo te dará más de ese estilo.</p>
      ${listaMini(parecidas)}
    </section>` : ''}

    ${seccionVariantes(receta)}

    <section class="tarjeta">
      <h2>📅 Agregar al calendario</h2>
      <p class="nota">Elige el día y si va de desayuno, comida o cena. Así aparece en el calendario de la semana.</p>
      <button class="btn btn--primario btn--bloque" type="button" data-accion="agregar-a" data-id="${esc(receta.id)}">${ICONOS.calendario} Agregar a un día</button>
      <label class="interruptor">
        <span>Entra al sorteo de sugerencias</span>
        <input type="checkbox" data-cambio="activa"${receta.activa ? ' checked' : ''}>
      </label>
    </section>`;
}

function cambiarPersonas(campo, cambio, ctx) {
  if (!personas || !recetaActual(ctx)) return;
  const valor = Math.min(20, Math.max(0, personas[campo] + cambio));
  const otro = campo === 'adultos' ? personas.ninos : personas.adultos;
  if (valor + otro === 0) return;
  personas[campo] = valor;
  ctx.repintar();
}

export function alMontar(raiz, ctx) {
  mostrarSeccionesIA(raiz);
  if (ctx.params.get('agregar')) {
    history.replaceState(null, '', `#/receta/${encodeURIComponent(ctx.args[0])}`);
    const receta = recetaActual(ctx);
    if (receta) abrirSelectorCalendario(receta, { fecha: ctx.params.get('fecha'), tipo: ctx.params.get('tipo') });
  }
}

export const acciones = {
  volver: (_boton, ctx) => regresar(ctx, '#/recetas'),
  async variantes(_boton, ctx) {
    const receta = recetaActual(ctx);
    if (!receta) return;
    const existentes = ctx.estado.recetas.map((r) => r.nombre);
    variantes = { id: receta.id, lista: [], cargando: true, error: '' };
    ctx.repintar();
    try {
      const { variantes: lista } = await variantesDe(receta, existentes);
      variantes = { id: receta.id, lista, cargando: false, error: '' };
    } catch (error) {
      variantes = { id: receta.id, lista: [], cargando: false, error: error.message };
    }
    if (location.hash.startsWith(`#/receta/${encodeURIComponent(receta.id)}`)) ctx.repintar();
  },
  'agregar-variante'(boton, ctx) {
    const variante = variantes.lista[Number(boton.dataset.indice)];
    if (!variante || variante.agregadaId) return;
    const guardada = guardarReceta({ ...variante, id: nuevoIdReceta(), origen: 'propia' });
    variante.agregadaId = guardada.id;
    toast(`¡${guardada.nombre} agregada! Ya entra al sorteo 🎲`);
  },
  favorita: accionFavorita,
  video: accionVideo,
  mas: (boton, ctx) => cambiarPersonas(boton.dataset.campo, 1, ctx),
  menos: (boton, ctx) => cambiarPersonas(boton.dataset.campo, -1, ctx),
  'agregar-a': accionAgregarA,
};

export const cambios = {
  activa: (_casilla, ctx) => alternarActiva(ctx.args[0]),
};
