// Arma la lista de compras de uno o varios días y la pinta. Sin depender del navegador
// (lo usan la página Compras, la hoja "Compras del día" y las pruebas).

import { TIPOS } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { listaDeCompras, porcionesTotales } from '../porciones.js';
import { esc, plural, textoPersonas } from '../util.js';

/** Clave de las palomitas de un día; la comparten la pestaña "Hoy"/"Mañana" de Compras y la hoja del día. */
export const claveListaDia = (fecha) => `dia:${fecha}`;

export function armarListaDias(estado, dias, clave, titulo) {
  const porId = new Map(estado.recetas.map((r) => [r.id, r]));
  const porciones = porcionesTotales(estado.ajustes);
  const entradas = dias.flatMap((dia) =>
    TIPOS.map((tipo) => porId.get(estado.plan[dia]?.[tipo])).filter(Boolean).map((receta) => ({ receta, porciones })));
  return { titulo, dias, clave, entradas, grupos: listaDeCompras(entradas), marcadas: new Set(estado.compras[clave] ?? []), ajustes: estado.ajustes };
}

const paraRecetas = (nombres) => (nombres.length <= 2 ? nombres.join(' · ') : `${nombres[0]} y ${nombres.length - 1} recetas más`);

export function avance({ grupos, marcadas }) {
  const comprables = grupos.filter((g) => g.id !== 'despensa').flatMap((g) => g.items);
  const enCarrito = comprables.filter((item) => marcadas.has(item.clave)).length;
  return { total: comprables.length, enCarrito, porcentaje: comprables.length ? Math.round((enCarrito / comprables.length) * 100) : 0 };
}

/** Texto para compartir: solo lo que falta comprar. */
export function textoParaCompartir({ titulo, grupos, marcadas, ajustes }) {
  const lineas = ['🛒 Lista de compras', titulo, `Para ${textoPersonas(ajustes)}`, ''];
  for (const grupo of grupos) {
    const pendientes = grupo.items.filter((item) => !marcadas.has(item.clave));
    if (!pendientes.length) continue;
    lineas.push(`${grupo.emoji} ${grupo.nombre}`);
    for (const item of pendientes) lineas.push(`• ${item.nombre}${item.total ? ` — ${item.texto}` : ''}`);
    lineas.push('');
  }
  return lineas.join('\n').trim();
}

/** Barra de avance + grupos con palomitas (las casillas llevan data-clave). */
export function htmlLista(lista) {
  const { grupos, marcadas } = lista;
  const { total, enCarrito, porcentaje } = avance(lista);
  return `<div class="progreso">
      <span>${enCarrito} de ${plural(total, 'producto', 'productos')} en el carrito</span>
      <div class="progreso__barra"><span style="width:${porcentaje}%"></span></div>
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
    </section>`).join('')}`;
}
