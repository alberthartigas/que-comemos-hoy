// Catálogo de recetas con búsqueda y filtros.

import { INFO_TIPO, TIPOS } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { normalizarTexto } from '../porciones.js';
import { esc } from '../util.js';

const FILTROS = [
  { id: 'todas', nombre: 'Todas' },
  ...TIPOS.map((tipo) => ({ id: tipo, nombre: `${INFO_TIPO[tipo].emoji} ${INFO_TIPO[tipo].nombre}` })),
  { id: 'favoritas', nombre: '❤️ Favoritas' },
  { id: 'propias', nombre: '✍️ Mías' },
  { id: 'pausadas', nombre: '⏸️ Pausadas' },
];

let consulta = '';

function pasaFiltro(receta, filtro) {
  if (filtro === 'todas') return true;
  if (filtro === 'favoritas') return receta.favorita;
  if (filtro === 'propias') return receta.origen === 'propia';
  if (filtro === 'pausadas') return !receta.activa;
  return receta.tipos.includes(filtro);
}

export function render({ estado, params }) {
  const filtro = FILTROS.some((f) => f.id === params.get('filtro')) ? params.get('filtro') : 'todas';
  const lista = estado.recetas.filter((r) => pasaFiltro(r, filtro)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const enSorteo = estado.recetas.filter((r) => r.activa).length;

  return `
    <header class="encabezado">
      <h1>Recetas</h1>
      <p class="subtitulo">${estado.recetas.length} recetas · ${enSorteo} entran al sorteo</p>
    </header>
    <label class="buscador">
      ${ICONOS.buscar}
      <input type="search" placeholder="Buscar platillo o ingrediente" value="${esc(consulta)}" data-entrada="buscar" aria-label="Buscar receta" enterkeyhint="search">
    </label>
    <nav class="filtros" aria-label="Filtrar recetas">
      ${FILTROS.map((f) => `<a href="#/recetas?filtro=${f.id}"${f.id === filtro ? ' aria-current="true"' : ''}>${f.nombre}</a>`).join('')}
    </nav>
    <ul class="lista-recetas">
      ${lista.map((r) => `<li data-busqueda="${esc(normalizarTexto(`${r.nombre} ${r.ingredientes.map((i) => i.nombre).join(' ')}`))}">
        <a class="receta-item${r.activa ? '' : ' receta-item--inactiva'}" href="#/receta/${encodeURIComponent(r.id)}">
          <span class="emoji-caja">${esc(r.emoji)}</span>
          <span class="receta-item__texto">
            <strong>${esc(r.nombre)}</strong>
            <small>${r.tipos.map((t) => INFO_TIPO[t].nombre).join(' · ')}${r.minutos ? ` · ${r.minutos} min` : ''}${r.activa ? '' : ' · pausada'}</small>
          </span>
          ${r.favorita ? `<span class="corazon" aria-label="Favorita">${ICONOS.corazon}</span>` : ''}
        </a>
      </li>`).join('')}
    </ul>
    <div class="vacio" data-sin-resultados${lista.length ? ' hidden' : ''}>
      <span class="vacio__emoji">🔎</span>
      <p>No encontramos recetas aquí.</p>
    </div>
    <a class="fab" href="#/nueva">${ICONOS.mas} Agregar comida</a>`;
}

function filtrarLista(raiz) {
  const texto = normalizarTexto(consulta);
  let visibles = 0;
  for (const elemento of raiz.querySelectorAll('[data-busqueda]')) {
    elemento.hidden = Boolean(texto) && !elemento.dataset.busqueda.includes(texto);
    if (!elemento.hidden) visibles++;
  }
  raiz.querySelector('[data-sin-resultados]').hidden = visibles > 0;
}

export function alMontar(raiz) {
  if (consulta) filtrarLista(raiz);
}

export const entradas = {
  buscar(campo) {
    consulta = campo.value;
    filtrarLista(campo.closest('.vista'));
  },
};
