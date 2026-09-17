// Hoja "¿Qué pones aquí?": para un día y comida vacíos (o quitados) deja elegir una receta guardada
// (de ese tipo o todas, con buscador), sortear una al azar o agregar una propia con la IA.

import { desdeClave, nombreDia } from '../fechas.js';
import { INFO_TIPO } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { normalizarTexto } from '../porciones.js';
import { alternarActiva, obtenerEstado, restaurarComida, usarRecetaEn } from '../store.js';
import { esc, toast } from '../util.js';
import { abrirHoja } from './hoja.js';
import { abrirHojaRecetaPropia } from './receta-propia-hoja.js';

export function abrirElegirReceta({ fecha, tipo }) {
  const info = INFO_TIPO[tipo];
  let todas = false;
  let consulta = '';

  const recetasFiltradas = () => {
    const texto = normalizarTexto(consulta);
    return obtenerEstado().recetas
      .filter((r) => todas || r.tipos.includes(tipo))
      .filter((r) => !texto || normalizarTexto(`${r.nombre} ${r.ingredientes.map((i) => i.nombre).join(' ')}`).includes(texto))
      .sort((a, b) => Number(b.favorita) - Number(a.favorita) || a.nombre.localeCompare(b.nombre, 'es'));
  };

  const htmlLista = () => {
    const lista = recetasFiltradas();
    if (!lista.length) return '<p class="nota">No hay recetas con ese nombre. Prueba "Todas" o agrega la tuya.</p>';
    return lista.map((r) => `<li><button class="receta-item receta-item--boton" type="button" data-elegir="${esc(r.id)}">
      <span class="emoji-caja">${esc(r.emoji)}</span>
      <span class="receta-item__texto"><strong>${esc(r.nombre)}</strong><small>${r.tipos.map((t) => INFO_TIPO[t].nombre).join(' · ')}${r.minutos ? ` · ${r.minutos} min` : ''}${r.favorita ? ' · ❤️' : ''}</small></span>
    </button></li>`).join('');
  };

  const hoja = abrirHoja(`<form method="dialog" class="hoja__contenido">
    <span class="hoja__asa"></span>
    <div class="hoja__cabecera">
      <h2>${info.emoji} ${info.nombre} del ${nombreDia(fecha).toLowerCase()} ${desdeClave(fecha).getDate()}</h2>
      <button class="btn btn--icono" type="button" data-cerrar aria-label="Cerrar">${ICONOS.cerrar}</button>
    </div>
    <div class="fila-botones">
      <button class="btn" type="button" data-sortear>🎲 Sortear una</button>
      <button class="btn btn--primario" type="button" data-propia>✍️ Agregar mi receta</button>
    </div>
    <p class="campo__titulo">O elige una guardada</p>
    <label class="buscador">${ICONOS.buscar}<input type="search" placeholder="Buscar platillo o ingrediente" data-buscar aria-label="Buscar receta"></label>
    <nav class="segmentado" aria-label="Filtro">
      <a href="#" data-filtro="tipo" aria-current="true">De ${info.nombre.toLowerCase()}</a>
      <a href="#" data-filtro="todas">Todas</a>
    </nav>
    <ul class="lista-recetas lista-recetas--mini" data-lista>${htmlLista()}</ul>
  </form>`);

  const pintarLista = () => {
    hoja.querySelector('[data-lista]').innerHTML = htmlLista();
    for (const enlace of hoja.querySelectorAll('[data-filtro]')) {
      if ((enlace.dataset.filtro === 'todas') === todas) enlace.setAttribute('aria-current', 'true');
      else enlace.removeAttribute('aria-current');
    }
  };

  hoja.onsubmit = (evento) => evento.preventDefault();
  hoja.oninput = (evento) => {
    if (evento.target.matches('[data-buscar]')) {
      consulta = evento.target.value;
      pintarLista();
    }
  };
  hoja.onclick = (evento) => {
    const filtro = evento.target.closest('[data-filtro]');
    if (filtro) {
      evento.preventDefault();
      todas = filtro.dataset.filtro === 'todas';
      pintarLista();
      return;
    }
    if (evento.target.closest('[data-sortear]')) {
      restaurarComida(fecha, tipo);
      hoja.close();
      toast(`${info.nombre} sorteado 🎲`);
      return;
    }
    if (evento.target.closest('[data-propia]')) {
      abrirHojaRecetaPropia({ fecha, tipo });
      return;
    }
    const elegido = evento.target.closest('[data-elegir]');
    if (elegido) {
      const receta = obtenerEstado().recetas.find((r) => r.id === elegido.dataset.elegir);
      if (!receta) return;
      if (!receta.activa) alternarActiva(receta.id);
      usarRecetaEn(fecha, tipo, receta.id);
      hoja.close();
      toast(`${receta.nombre} → ${info.nombre.toLowerCase()} del ${nombreDia(fecha).toLowerCase()} ${desdeClave(fecha).getDate()}`);
    }
  };
}
