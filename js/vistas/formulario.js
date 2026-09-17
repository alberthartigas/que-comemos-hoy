// Agregar o editar una receta.

import { INFO_TIPO, TIPOS } from '../horarios.js';
import { recetaDesdeTikTok } from '../ia.js';
import { ICONOS } from '../iconos.js';
import { UNIDADES } from '../porciones.js';
import { ETIQUETAS } from '../recetas.js';
import { eliminarReceta, guardarReceta, nuevoIdReceta } from '../store.js';
import { normalizarUrlTikTok } from '../tiktok.js';
import { esc, toast } from '../util.js';
import { mostrarSeccionesIA, regresar } from './comun.js';

const EMOJIS = ['🍳', '🥞', '🥑', '🌮', '🌯', '🥗', '🍲', '🍝', '🍗', '🐟', '🍕', '🥪'];
const NOMBRE_UNIDAD = {
  pza: 'pieza', g: 'gramos', kg: 'kilos', ml: 'mililitros', l: 'litros', taza: 'taza', cda: 'cucharada',
  cdita: 'cucharadita', rebanada: 'rebanada', diente: 'diente', lata: 'lata', paquete: 'paquete', manojo: 'manojo',
  hoja: 'hoja', gusto: 'al gusto',
};

const recetaEditada = (ctx) => (ctx.nombre === 'editar' ? ctx.estado.recetas.find((r) => r.id === ctx.args[0]) : null);

// Receta que propuso la IA para el formulario actual (se pierde al guardar o al salir).
let borradorIA = null;

function filaIngrediente(ing = { nombre: '', cantidad: '', unidad: 'pza' }) {
  const cantidad = ing.unidad === 'gusto' ? '' : ing.cantidad;
  return `<div class="ing-fila" data-ingrediente data-unidad="${esc(ing.unidad)}" data-paso="${esc(ing.paso ?? '')}">
    <input class="entrada ing-fila__nombre" name="ing-nombre" placeholder="Ingrediente (ej. Huevo)" value="${esc(ing.nombre)}" maxlength="60" autocomplete="off" aria-label="Ingrediente">
    <button class="btn btn--icono ing-fila__quitar" type="button" data-accion="quitar-ingrediente" aria-label="Quitar ingrediente">${ICONOS.basura}</button>
    <input class="entrada ing-fila__cantidad" name="ing-cantidad" inputmode="decimal" placeholder="Cant." value="${esc(cantidad)}" aria-label="Cantidad para 1 adulto">
    <select class="entrada ing-fila__unidad" name="ing-unidad" aria-label="Unidad">
      ${UNIDADES.map((u) => `<option value="${u.id}"${u.id === ing.unidad ? ' selected' : ''}>${NOMBRE_UNIDAD[u.id] ?? u.id}</option>`).join('')}
    </select>
  </div>`;
}

/** Acepta "0.5", "0,5", "1/2" y "1 1/2". */
function leerNumero(texto) {
  const limpio = String(texto).trim().replace(',', '.');
  const mixto = /^(\d+)\s+(\d+)\/(\d+)$/.exec(limpio);
  if (mixto) return Number(mixto[1]) + Number(mixto[2]) / Number(mixto[3]);
  const fraccion = /^(\d+)\/(\d+)$/.exec(limpio);
  if (fraccion) return Number(fraccion[1]) / Number(fraccion[2]);
  return limpio ? Number(limpio) : NaN;
}

function leerIngrediente(fila) {
  const nombre = fila.querySelector('[name="ing-nombre"]').value.trim();
  const unidad = fila.querySelector('[name="ing-unidad"]').value;
  const cantidad = unidad === 'gusto' ? 0 : leerNumero(fila.querySelector('[name="ing-cantidad"]').value);
  // Conserva el redondeo original; en piezas enteras (2 huevos, 3 tortillas) redondea a piezas completas.
  const pasoOriginal = fila.dataset.unidad === unidad ? Number(fila.dataset.paso) : 0;
  const paso = pasoOriginal > 0 ? pasoOriginal : unidad === 'pza' && Number.isInteger(cantidad) && cantidad >= 1 ? 1 : 0;
  return { nombre, cantidad, unidad, ...(paso ? { paso } : {}) };
}

export function render(ctx) {
  const existente = recetaEditada(ctx);
  if (ctx.nombre === 'editar' && !existente) {
    return `<div class="vacio"><span class="vacio__emoji">🤷</span><p>Esta receta ya no existe.</p><a class="btn btn--primario" href="#/recetas">Ver recetas</a></div>`;
  }
  const tipoPedido = ctx.params.get('tipo');
  let receta = existente ?? {
    nombre: '', emoji: '🍽️', tipos: TIPOS.includes(tipoPedido) ? [tipoPedido] : [], minutos: '', etiquetas: [], tip: '',
    pasos: [], tiktok: '', ingredientes: [0, 1, 2].map(() => ({ nombre: '', cantidad: '', unidad: 'pza' })),
  };
  if (borradorIA?.hash === location.hash) receta = { ...receta, ...borradorIA.receta };
  const etiquetas = [...new Set([...ETIQUETAS, ...receta.etiquetas])];

  return `
    <div class="barra-superior">
      <button class="btn btn--icono" type="button" data-accion="volver" aria-label="Regresar">${ICONOS.atras}</button>
    </div>
    <header class="encabezado">
      <h1>${existente ? 'Editar receta' : 'Nueva comida'}</h1>
      <p class="subtitulo">Escribe las cantidades para <strong>1 adulto</strong>: la app calcula para toda la familia.</p>
    </header>

    <form class="formulario" data-envio="guardar" novalidate>
      <section class="tarjeta tarjeta--ia" data-seccion-ia hidden>
        <h2>🤖 Llenar con IA</h2>
        <p class="nota">Pega el enlace del video de TikTok y la IA escribe el nombre, los ingredientes y los pasos. Luego revisa, corrige lo que quieras y guarda.</p>
        <input class="entrada" name="ia-url" inputmode="url" placeholder="https://www.tiktok.com/@.../video/..." value="${esc(receta.tiktok)}" autocomplete="off" aria-label="Enlace de TikTok para la IA">
        <button class="btn btn--primario btn--bloque" type="button" data-accion="ia-tiktok">✨ Llenar la receta con IA</button>
        ${borradorIA?.hash === location.hash ? '<p class="tip">✅ La IA llenó la receta. Revísala y toca Guardar.</p>' : ''}
      </section>

      <label class="campo">
        <span class="campo__titulo">Nombre del platillo</span>
        <input class="entrada" name="nombre" maxlength="80" value="${esc(receta.nombre)}" placeholder="Ej. Tacos de frijol con nopales" autocomplete="off">
      </label>

      <div class="campo">
        <span class="campo__titulo">Ícono</span>
        <div class="emoji-elegido">
          <input class="entrada" name="emoji" value="${esc(receta.emoji)}" maxlength="8" aria-label="Emoji del platillo">
          <div class="emojis-rapidos">${EMOJIS.map((e) => `<button type="button" data-accion="emoji" data-emoji="${e}" aria-label="Usar ${e}">${e}</button>`).join('')}</div>
        </div>
      </div>

      <fieldset class="campo">
        <legend class="campo__titulo">¿Para cuándo es?</legend>
        <div class="opciones">
          ${TIPOS.map((t) => `<label class="opcion"><input type="checkbox" name="tipos" value="${t}"${receta.tipos.includes(t) ? ' checked' : ''}><span>${INFO_TIPO[t].emoji} ${INFO_TIPO[t].nombre}</span></label>`).join('')}
        </div>
      </fieldset>

      <label class="campo">
        <span class="campo__titulo">Tiempo de preparación (minutos)</span>
        <input class="entrada" name="minutos" inputmode="numeric" value="${esc(receta.minutos)}" placeholder="Ej. 20">
      </label>

      <fieldset class="campo">
        <legend class="campo__titulo">Ingredientes para 1 adulto</legend>
        <small>Los niños se calculan solos. Para sal, especias o aceite elige "al gusto". Puedes escribir 1/2.</small>
        <div class="ingredientes-form" data-lista-ingredientes>${receta.ingredientes.map(filaIngrediente).join('')}</div>
        <button class="btn" type="button" data-accion="agregar-ingrediente">${ICONOS.mas} Agregar ingrediente</button>
      </fieldset>

      <label class="campo">
        <span class="campo__titulo">Preparación</span>
        <small>Un paso por renglón.</small>
        <textarea class="entrada" name="pasos" rows="6" placeholder="Pica la cebolla y el jitomate.&#10;Cocina 5 minutos.">${esc(receta.pasos.join('\n'))}</textarea>
      </label>

      <div class="campo">
        <label class="campo__titulo" for="campo-tiktok">Video de TikTok (opcional)</label>
        <input class="entrada" id="campo-tiktok" name="tiktok" inputmode="url" value="${esc(receta.tiktok)}" placeholder="https://www.tiktok.com/@.../video/..." autocomplete="off">
        <small>En TikTok toca Compartir → Copiar enlace y pégalo aquí; el video se verá dentro de la app. También puedes buscarlo después desde la receta.</small>
      </div>

      <fieldset class="campo">
        <legend class="campo__titulo">Etiquetas</legend>
        <div class="opciones">
          ${etiquetas.map((e) => `<label class="opcion"><input type="checkbox" name="etiquetas" value="${esc(e)}"${receta.etiquetas.includes(e) ? ' checked' : ''}><span>${esc(e)}</span></label>`).join('')}
        </div>
      </fieldset>

      <label class="campo">
        <span class="campo__titulo">Consejo (opcional)</span>
        <input class="entrada" name="tip" maxlength="240" value="${esc(receta.tip)}" placeholder="Ej. Se puede dejar lista la noche anterior">
      </label>

      <button class="btn btn--primario btn--bloque" type="submit">${ICONOS.check} Guardar receta</button>
      ${existente ? `<button class="btn btn--peligro btn--bloque" type="button" data-accion="eliminar">${ICONOS.basura} Eliminar receta</button>` : ''}
    </form>`;
}

export function alMontar(raiz) {
  mostrarSeccionesIA(raiz);
}

export const acciones = {
  volver(_boton, ctx) {
    borradorIA = null;
    regresar(ctx, '#/recetas');
  },
  async 'ia-tiktok'(boton, ctx) {
    const form = boton.closest('form');
    const url = normalizarUrlTikTok(form.elements['ia-url'].value);
    if (!url) {
      toast('Pega un enlace de tiktok.com.');
      form.elements['ia-url'].focus();
      return;
    }
    const hash = location.hash;
    boton.disabled = true;
    boton.textContent = '⏳ Pensando… tarda unos segundos';
    try {
      const { receta } = await recetaDesdeTikTok(url, form.elements.nombre.value.trim());
      borradorIA = { hash, receta: { ...receta, tiktok: url } };
      toast('✨ Listo: revisa la receta y guárdala');
      if (location.hash === hash) ctx.repintar();
    } catch (error) {
      toast(error.message);
      boton.disabled = false;
      boton.textContent = '✨ Llenar la receta con IA';
    }
  },
  emoji(boton) {
    boton.closest('form').elements.emoji.value = boton.dataset.emoji;
  },
  'agregar-ingrediente'(boton) {
    const lista = boton.closest('form').querySelector('[data-lista-ingredientes]');
    lista.insertAdjacentHTML('beforeend', filaIngrediente());
    lista.lastElementChild.querySelector('input').focus();
  },
  'quitar-ingrediente'(boton) {
    boton.closest('[data-ingrediente]').remove();
  },
  eliminar(_boton, ctx) {
    const receta = recetaEditada(ctx);
    if (!receta || !confirm(`¿Eliminar "${receta.nombre}"? Ya no aparecerá en las sugerencias.`)) return;
    eliminarReceta(receta.id);
    toast('Receta eliminada');
    ctx.navegar('#/recetas', { reemplazar: true });
  },
};

export const envios = {
  guardar(form, ctx) {
    const existente = recetaEditada(ctx);
    const datos = new FormData(form);
    const nombre = String(datos.get('nombre')).trim();
    const tipos = datos.getAll('tipos');
    const ingredientes = [...form.querySelectorAll('[data-ingrediente]')].map(leerIngrediente).filter((i) => i.nombre);
    const textoTikTok = String(datos.get('tiktok')).trim();
    const tiktok = normalizarUrlTikTok(textoTikTok);

    const error =
      (!nombre && ['nombre', 'Ponle nombre al platillo.']) ||
      (!tipos.length && [null, 'Elige si es desayuno, comida o cena.']) ||
      (!ingredientes.length && [null, 'Agrega al menos un ingrediente.']) ||
      (ingredientes.some((i) => i.unidad !== 'gusto' && !(i.cantidad > 0)) && [null, 'Revisa las cantidades: pon un número o elige "al gusto".']) ||
      (textoTikTok && !tiktok && ['tiktok', 'El enlace debe ser de tiktok.com.']);
    if (error) {
      toast(error[1]);
      if (error[0]) form.elements[error[0]].focus();
      return;
    }

    const guardada = guardarReceta({
      ...(existente ?? {}),
      id: existente?.id ?? nuevoIdReceta(),
      origen: existente?.origen ?? 'propia',
      nombre,
      emoji: String(datos.get('emoji')).trim() || '🍽️',
      tipos,
      minutos: leerNumero(datos.get('minutos')) || 0,
      ingredientes,
      pasos: String(datos.get('pasos')).split('\n').map((p) => p.trim()).filter(Boolean),
      tiktok,
      etiquetas: datos.getAll('etiquetas'),
      tip: String(datos.get('tip')).trim(),
    });
    borradorIA = null;
    toast(existente ? 'Cambios guardados' : '¡Receta agregada! Ya entra al sorteo 🎲');
    ctx.navegar(`#/receta/${encodeURIComponent(guardada.id)}`, { reemplazar: true });
  },
};
