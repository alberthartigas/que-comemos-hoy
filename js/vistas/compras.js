// Lista de compras sumada y escalada para hoy, mañana, 7 días o una semana del plan.

import { claveFecha, diasDeSemana, fechaLarga, inicioSemana, rangoFechas, rangoSemana, sumarDias } from '../fechas.js';
import { TIPOS } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { listaDeCompras, porcionesTotales } from '../porciones.js';
import { alternarCompra, asegurarSemana, desmarcarCompras } from '../store.js';
import { copiarTexto, esc, plural, textoPersonas, toast } from '../util.js';

const RANGOS = [
  { id: 'dia', nombre: 'Hoy' },
  { id: 'manana', nombre: 'Mañana' },
  { id: '7dias', nombre: '7 días' },
];

function periodo({ params, ahora }) {
  const hoy = claveFecha(ahora);
  const pedido = params.get('rango');
  if (pedido === 'dia') return { id: 'dia', dias: [hoy], titulo: `Hoy · ${fechaLarga(hoy)}` };
  if (pedido === 'manana') {
    const manana = sumarDias(hoy, 1);
    return { id: 'manana', dias: [manana], titulo: `Mañana · ${fechaLarga(manana)}` };
  }
  if (pedido === 'semana' && /^\d{4}-\d{2}-\d{2}$/.test(params.get('semana') ?? '')) {
    const lunes = inicioSemana(params.get('semana'));
    return { id: 'semana', dias: diasDeSemana(lunes).filter((dia) => dia >= hoy), titulo: `Semana ${rangoSemana(lunes)}`, clave: `semana:${lunes}` };
  }
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));
  return { id: '7dias', dias, titulo: `Próximos 7 días · ${rangoFechas(dias[0], dias[6])}` };
}

function armarLista(ctx) {
  const { estado } = ctx;
  const rango = periodo(ctx);
  const porId = new Map(estado.recetas.map((r) => [r.id, r]));
  const porciones = porcionesTotales(estado.ajustes);
  const entradas = rango.dias.flatMap((dia) =>
    TIPOS.map((tipo) => porId.get(estado.plan[dia]?.[tipo])).filter(Boolean).map((receta) => ({ receta, porciones })));
  const clave = rango.clave ?? `${rango.id}:${rango.dias[0]}`;
  return { rango, entradas, clave, grupos: listaDeCompras(entradas), marcadas: new Set(estado.compras[clave] ?? []), ajustes: estado.ajustes };
}

const paraRecetas = (nombres) => (nombres.length <= 2 ? nombres.join(' · ') : `${nombres[0]} y ${nombres.length - 1} recetas más`);

/** Texto para compartir: solo lo que falta comprar. */
function textoParaCompartir({ rango, grupos, marcadas, ajustes }) {
  const lineas = ['🛒 Lista de compras', rango.titulo, `Para ${textoPersonas(ajustes)}`, ''];
  for (const grupo of grupos) {
    const pendientes = grupo.items.filter((item) => !marcadas.has(item.clave));
    if (!pendientes.length) continue;
    lineas.push(`${grupo.emoji} ${grupo.nombre}`);
    for (const item of pendientes) lineas.push(`• ${item.nombre}${item.total ? ` — ${item.texto}` : ''}`);
    lineas.push('');
  }
  return lineas.join('\n').trim();
}

export function preparar(ctx) {
  const hoy = claveFecha(ctx.ahora);
  for (const lunes of new Set(periodo(ctx).dias.map(inicioSemana))) asegurarSemana(lunes, hoy);
}

export function render(ctx) {
  const lista = armarLista(ctx);
  const { rango, entradas, grupos, marcadas, ajustes } = lista;
  const comprables = grupos.filter((g) => g.id !== 'despensa').flatMap((g) => g.items);
  const enCarrito = comprables.filter((item) => marcadas.has(item.clave)).length;
  const avance = comprables.length ? Math.round((enCarrito / comprables.length) * 100) : 0;

  const contenido = entradas.length
    ? `<div class="progreso">
        <span>${enCarrito} de ${plural(comprables.length, 'producto', 'productos')} en el carrito</span>
        <div class="progreso__barra"><span style="width:${avance}%"></span></div>
      </div>
      ${grupos.map((grupo) => `<section class="tarjeta">
        <h2>${grupo.emoji} ${esc(grupo.nombre)}</h2>
        ${grupo.id === 'despensa' ? '<p class="nota">Casi siempre ya los tienes: solo revisa que no se hayan acabado.</p>' : ''}
        <ul class="checklist">
          ${grupo.items.map((item) => `<li><label class="check">
            <input type="checkbox" data-cambio="marcar" data-clave="${esc(item.clave)}"${marcadas.has(item.clave) ? ' checked' : ''}>
            <span class="check__caja">${ICONOS.check}</span>
            <span class="check__nombre">${esc(item.nombre)}<small>${esc(paraRecetas(item.recetas))}</small></span>
            <span class="check__cantidad">${esc(item.texto)}</span>
          </label></li>`).join('')}
        </ul>
      </section>`).join('')}
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
        <a class="btn btn--primario" href="#/semana">Ver plan de la semana</a>
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
