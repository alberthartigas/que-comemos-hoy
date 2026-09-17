// Página de compras: hoy, mañana, 7 días o una semana del plan.

import { claveFecha, diasDeSemana, fechaLarga, inicioSemana, rangoFechas, rangoSemana, sumarDias } from '../fechas.js';
import { ICONOS } from '../iconos.js';
import { alternarCompra, asegurarSemana, desmarcarCompras } from '../store.js';
import { copiarTexto, esc, plural, textoPersonas, toast } from '../util.js';
import { armarListaDias, avance, claveListaDia, htmlLista, textoParaCompartir } from './compras-lista.js';

const RANGOS = [
  { id: 'dia', nombre: 'Hoy' },
  { id: 'manana', nombre: 'Mañana' },
  { id: '7dias', nombre: '7 días' },
];

function periodo({ params, ahora }) {
  const hoy = claveFecha(ahora);
  const pedido = params.get('rango');
  if (pedido === 'dia') return { id: 'dia', dias: [hoy], titulo: `Hoy · ${fechaLarga(hoy)}`, clave: claveListaDia(hoy) };
  if (pedido === 'manana') {
    const manana = sumarDias(hoy, 1);
    return { id: 'manana', dias: [manana], titulo: `Mañana · ${fechaLarga(manana)}`, clave: claveListaDia(manana) };
  }
  if (pedido === 'semana' && /^\d{4}-\d{2}-\d{2}$/.test(params.get('semana') ?? '')) {
    const lunes = inicioSemana(params.get('semana'));
    return { id: 'semana', dias: diasDeSemana(lunes).filter((dia) => dia >= hoy), titulo: `Semana ${rangoSemana(lunes)}`, clave: `semana:${lunes}` };
  }
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));
  return { id: '7dias', dias, titulo: `Próximos 7 días · ${rangoFechas(dias[0], dias[6])}`, clave: `7dias:${hoy}` };
}

function armarLista(ctx) {
  const rango = periodo(ctx);
  return { rango, ...armarListaDias(ctx.estado, rango.dias, rango.clave, rango.titulo) };
}

export function preparar(ctx) {
  const hoy = claveFecha(ctx.ahora);
  for (const lunes of new Set(periodo(ctx).dias.map(inicioSemana))) asegurarSemana(lunes, hoy);
}

export function render(ctx) {
  const lista = armarLista(ctx);
  const { rango, entradas, ajustes } = lista;
  const { enCarrito } = avance(lista);

  const contenido = entradas.length
    ? `${htmlLista(lista)}
      <div class="acciones-pie">
        <button class="btn btn--primario" type="button" data-accion="compartir">${ICONOS.compartir} Compartir lo que falta</button>
        <div class="fila-botones">
          <a class="btn btn--verde" href="https://wa.me/?text=${encodeURIComponent(textoParaCompartir(lista))}" target="_blank" rel="noopener">${ICONOS.mensaje} WhatsApp</a>
          <button class="btn" type="button" data-accion="copiar">${ICONOS.copiar} Copiar</button>
        </div>
        ${enCarrito ? '<button class="btn btn--texto" type="button" data-accion="desmarcar">Desmarcar todo</button>' : ''}
      </div>`
    : `<div class="vacio">
        <span class="vacio__emoji">🛒</span>
        <p>No hay comidas planeadas en estas fechas.</p>
        <a class="btn btn--primario" href="#/semana">Ver el calendario</a>
      </div>`;

  return `
    <header class="encabezado">
      <h1>Lista de compras</h1>
      <p class="subtitulo">${esc(rango.titulo)}<br>${plural(entradas.length, 'comida', 'comidas')} para ${textoPersonas(ajustes)}</p>
    </header>
    <nav class="segmentado" aria-label="Periodo">
      ${RANGOS.map((r) => `<a href="#/compras?rango=${r.id}"${r.id === rango.id ? ' aria-current="true"' : ''}>${r.nombre}</a>`).join('')}
    </nav>
    ${contenido}`;
}

export const cambios = {
  marcar(casilla, ctx) {
    alternarCompra(armarLista(ctx).clave, casilla.dataset.clave);
  },
};

export const acciones = {
  async compartir(_boton, ctx) {
    const texto = textoParaCompartir(armarLista(ctx));
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Lista de compras', text: texto });
      } catch {
        // la persona canceló
      }
      return;
    }
    toast((await copiarTexto(texto)) ? 'Lista copiada: pégala en WhatsApp o en tus notas' : 'No se pudo copiar');
  },
  async copiar(_boton, ctx) {
    toast((await copiarTexto(textoParaCompartir(armarLista(ctx)))) ? 'Lista copiada' : 'No se pudo copiar');
  },
  desmarcar(_boton, ctx) {
    desmarcarCompras(armarLista(ctx).clave);
  },
};
