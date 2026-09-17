// Hoja "Agregar mi receta": escribes el platillo, la app busca la receta en internet (IA) y un video
// de TikTok de referencia, la guarda y la deja en ese día y comida del calendario.

import { fechaLarga } from '../fechas.js';
import { INFO_TIPO } from '../horarios.js';
import { buscarVideoTikTok, estadoIA, recetaDesdeNombre } from '../ia.js';
import { ICONOS } from '../iconos.js';
import { guardarReceta, nuevoIdReceta, usarRecetaEn } from '../store.js';
import { esc, toast } from '../util.js';
import { abrirHoja } from './hoja.js';

export function abrirHojaRecetaPropia({ fecha, tipo }) {
  const info = INFO_TIPO[tipo];
  const cuando = `${info.articulo} ${info.nombre.toLowerCase()} del ${fechaLarga(fecha).toLowerCase()}`;
  const hoja = abrirHoja(`<form method="dialog" class="hoja__contenido">
    <span class="hoja__asa"></span>
    <div class="hoja__cabecera">
      <h2>✍️ Agregar mi receta</h2>
      <button class="btn btn--icono" type="button" data-cerrar aria-label="Cerrar">${ICONOS.cerrar}</button>
    </div>
    <p class="nota">Para ${esc(cuando)}.</p>
    <input class="entrada" name="nombre" placeholder="¿Qué platillo? Ej. Enchiladas suizas" maxlength="80" autocomplete="off" enterkeyhint="search">
    <p class="nota" data-explicacion>La app busca en internet la receta (ingredientes para 1 adulto y pasos) y un video de TikTok de referencia, y la deja lista en el calendario.</p>
    <button class="btn btn--primario btn--bloque" type="submit" data-buscar>🔎 Buscar y agregar</button>
    <div class="hoja__estado" data-estado hidden></div>
    <div class="fila-botones" data-final hidden></div>
    <a class="btn btn--texto" href="#/nueva?tipo=${tipo}">Prefiero escribirla a mano</a>
  </form>`);
  const form = hoja.querySelector('form');
  const campo = form.elements.nombre;
  const boton = form.querySelector('[data-buscar]');
  const estadoEl = form.querySelector('[data-estado]');
  const mostrar = (html) => {
    estadoEl.hidden = false;
    estadoEl.innerHTML = html;
  };
  setTimeout(() => campo.focus(), 50);

  estadoIA().then((estado) => {
    if (estado.disponible || !hoja.open) return;
    boton.disabled = true;
    mostrar('⚠️ La búsqueda automática necesita el servidor con IA (en esta versión local no está). Escríbela a mano con el botón de abajo.');
  });

  hoja.onsubmit = async (evento) => {
    evento.preventDefault(); // que no se cierre la hoja al enviar
    const nombre = campo.value.trim();
    if (nombre.length < 3) {
      toast('Escribe el nombre del platillo.');
      campo.focus();
      return;
    }
    boton.disabled = true;
    campo.disabled = true;
    try {
      mostrar(`<span class="girando"></span> Buscando la receta de «${esc(nombre)}»…`);
      const { receta } = await recetaDesdeNombre(nombre, tipo);
      mostrar(`<span class="girando"></span> Receta lista. Buscando un video en TikTok…`);
      let video = { url: null };
      try {
        video = await buscarVideoTikTok(receta.nombre);
      } catch {
        video = { url: null };
      }
      const guardada = guardarReceta({ ...receta, id: nuevoIdReceta(), origen: 'propia', tiktok: video.url ?? '' });
      usarRecetaEn(fecha, tipo, guardada.id);
      const detalleVideo = video.url
        ? `Video de TikTok de ${esc(video.autor || 'referencia')} agregado.`
        : 'No encontré un video verificado: el botón TikTok de la receta abre la búsqueda del platillo.';
      mostrar(`✅ <strong>${esc(guardada.emoji)} ${esc(guardada.nombre)}</strong> ya está en ${esc(cuando)}: ${guardada.ingredientes.length} ingredientes y ${guardada.pasos.length} pasos. ${detalleVideo}`);
      const final = form.querySelector('[data-final]');
      final.hidden = false;
      final.innerHTML = `<a class="btn btn--primario" href="#/receta/${encodeURIComponent(guardada.id)}">Ver receta</a><button class="btn" type="button" data-cerrar>Listo</button>`;
      final.querySelector('[data-cerrar]').addEventListener('click', () => hoja.close());
      boton.hidden = true;
      form.querySelector('[data-explicacion]').hidden = true;
      toast(`${guardada.nombre} agregada ✅`);
    } catch (error) {
      mostrar(`⚠️ ${esc(error.message)}`);
      boton.disabled = false;
      campo.disabled = false;
    }
  };
}
