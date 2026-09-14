// Detalle: ingredientes escalados, mini receta y videos de TikTok.

import { claveFecha, fechaLarga } from '../fechas.js';
import { INFO_TIPO } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { escalarIngredientes, porcionesTotales } from '../porciones.js';
import { recetasParecidas } from '../similares.js';
import { alternarActiva, usarRecetaEn } from '../store.js';
import { busquedaTikTok } from '../tiktok.js';
import { autorTikTok, esc, toast } from '../util.js';
import { accionFavorita, botonFavorita, listaMini, regresar, stepperPersonas } from './comun.js';

// Adultos y niños solo para esta receta (no cambia los ajustes de la casa).
let personas = null;

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
      <h2>🎥 Mírala en TikTok</h2>
      ${receta.tiktok ? `<a class="btn btn--tiktok btn--bloque" href="${esc(receta.tiktok)}" target="_blank" rel="noopener">${ICONOS.play} Ver video${autor ? ` de ${esc(autor)}` : ''}</a>` : ''}
      <a class="btn btn--bloque" href="${esc(busquedaTikTok(receta.nombre))}" target="_blank" rel="noopener">${ICONOS.buscar} Buscar más videos en TikTok</a>
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

    <section class="tarjeta">
      <h2>📅 Cocinarla hoy</h2>
      <p class="nota">Ponla en el plan de hoy en lugar de la sugerencia:</p>
      <div class="fila-botones">
        ${receta.tipos.map((t) => `<button class="btn" type="button" data-accion="usar" data-tipo="${t}">${INFO_TIPO[t].emoji} ${INFO_TIPO[t].nombre}</button>`).join('')}
      </div>
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

export const acciones = {
  volver: (_boton, ctx) => regresar(ctx, '#/recetas'),
  favorita: accionFavorita,
  mas: (boton, ctx) => cambiarPersonas(boton.dataset.campo, 1, ctx),
  menos: (boton, ctx) => cambiarPersonas(boton.dataset.campo, -1, ctx),
  usar(boton, ctx) {
    const receta = recetaActual(ctx);
    if (!receta) return;
    const info = INFO_TIPO[boton.dataset.tipo];
    if (!receta.activa) alternarActiva(receta.id);
    usarRecetaEn(claveFecha(new Date()), boton.dataset.tipo, receta.id);
    toast(`Listo: es ${info.articulo} ${info.nombre.toLowerCase()} de hoy`);
  },
};

export const cambios = {
  activa: (_casilla, ctx) => alternarActiva(ctx.args[0]),
};
