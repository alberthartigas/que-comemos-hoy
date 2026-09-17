// Hoja "Compras del día": las compras de un solo día del calendario, con palomitas compartidas
// con la pestaña Hoy/Mañana de la página Compras.

import { claveFecha, desdeClave, fechaLarga, inicioSemana, nombreDia } from '../fechas.js';
import { ICONOS } from '../iconos.js';
import { alternarCompra, obtenerEstado, suscribir } from '../store.js';
import { copiarTexto, esc, plural, textoPersonas, toast } from '../util.js';
import { armarListaDias, claveListaDia, htmlLista, textoParaCompartir } from './compras-lista.js';
import { abrirHoja } from './hoja.js';

export function abrirComprasDelDia(fecha) {
  const hoy = claveFecha();
  const clave = claveListaDia(fecha);
  const titulo = fecha === hoy ? 'Compras de hoy' : `Compras del ${nombreDia(fecha).toLowerCase()} ${desdeClave(fecha).getDate()}`;
  const armar = () => armarListaDias(obtenerEstado(), [fecha], clave, `${titulo} · ${fechaLarga(fecha)}`);

  const html = () => {
    const lista = armar();
    return `<form method="dialog" class="hoja__contenido">
      <span class="hoja__asa"></span>
      <div class="hoja__cabecera">
        <h2>🛒 ${esc(titulo)}</h2>
        <button class="btn btn--icono" type="button" data-cerrar aria-label="Cerrar">${ICONOS.cerrar}</button>
      </div>
      <p class="nota">${esc(fechaLarga(fecha))} · ${plural(lista.entradas.length, 'comida', 'comidas')} para ${textoPersonas(lista.ajustes)}</p>
      ${lista.entradas.length
        ? `${htmlLista(lista)}
          <div class="fila-botones">
            <a class="btn btn--verde" href="https://wa.me/?text=${encodeURIComponent(textoParaCompartir(lista))}" target="_blank" rel="noopener">${ICONOS.mensaje} WhatsApp</a>
            <button class="btn" type="button" data-copiar>${ICONOS.copiar} Copiar</button>
          </div>`
        : '<div class="vacio"><span class="vacio__emoji">🛒</span><p>No hay comidas planeadas este día.</p></div>'}
      <a class="btn btn--texto" href="#/compras?rango=semana&semana=${inicioSemana(fecha)}">Ver las compras de toda la semana ${ICONOS.adelante}</a>
    </form>`;
  };

  const pintar = () => {
    const hoja = abrirHoja(html());
    hoja.onchange = (evento) => {
      const casilla = evento.target.closest('[data-clave]');
      if (casilla) alternarCompra(clave, casilla.dataset.clave);
    };
    hoja.onclick = async (evento) => {
      if (evento.target.closest('[data-copiar]')) toast((await copiarTexto(textoParaCompartir(armar()))) ? 'Lista copiada' : 'No se pudo copiar');
    };
    return hoja;
  };

  const hoja = pintar();
  // Al palomear, el estado cambia: se vuelve a pintar la hoja conservando el desplazamiento.
  const desuscribir = suscribir(() => {
    if (!hoja.open) return;
    const arriba = hoja.querySelector('.hoja__contenido')?.scrollTop ?? 0;
    pintar();
    hoja.querySelector('.hoja__contenido').scrollTop = arriba;
  });
  hoja.addEventListener('close', () => desuscribir(), { once: true });
}
