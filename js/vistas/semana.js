// Plan de lunes a domingo, con cambio de platillo por espacio.

import { claveFecha, desdeClave, diasDeSemana, inicioSemana, nombreDia, rangoSemana, sumarDias } from '../fechas.js';
import { TIPOS } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { asegurarSemana, volverASortearSemana } from '../store.js';
import { plural, toast } from '../util.js';
import { accionOtraOpcion, filaSlot } from './comun.js';

function lunesPedido({ params, ahora }) {
  const pedido = params.get('semana');
  return inicioSemana(/^\d{4}-\d{2}-\d{2}$/.test(pedido ?? '') ? pedido : claveFecha(ahora));
}

export function preparar(ctx) {
  asegurarSemana(lunesPedido(ctx), claveFecha(ctx.ahora));
}

export function render(ctx) {
  const { estado, ahora } = ctx;
  const hoy = claveFecha(ahora);
  const lunes = lunesPedido(ctx);
  const lunesActual = inicioSemana(hoy);
  const porId = new Map(estado.recetas.map((r) => [r.id, r]));
  const quedanDias = sumarDias(lunes, 6) >= hoy;
  const nombreSemana = lunes === lunesActual ? 'Esta semana' : lunes > lunesActual ? 'Próxima semana' : 'Semana pasada';

  // Los días pasados sin nada planeado (p. ej. antes de empezar a usar la app) no se muestran uno por uno.
  const conRegistro = (dia) => TIPOS.some((tipo) => porId.has(estado.plan[dia]?.[tipo]));
  const visibles = diasDeSemana(lunes).filter((dia) => dia >= hoy || conRegistro(dia));
  const ocultos = 7 - visibles.length;
  const avisoOcultos = !ocultos ? ''
    : ocultos === 7 ? '<p class="nota">Esta semana no tiene comidas registradas.</p>'
    : `<p class="nota">${plural(ocultos, 'día anterior', 'días anteriores')} sin registro.</p>`;

  const dias = visibles.map((dia) => {
    const pasado = dia < hoy;
    const clases = ['dia', dia === hoy && 'dia--hoy', pasado && 'dia--pasado'].filter(Boolean).join(' ');
    return `<section class="${clases}">
      <h2 class="dia__titulo">${nombreDia(dia)} ${desdeClave(dia).getDate()}${dia === hoy ? ' <span class="chip chip--comida">Hoy</span>' : ''}</h2>
      <div class="slots">
        ${TIPOS.map((tipo) => filaSlot({ receta: porId.get(estado.plan[dia]?.[tipo]), fecha: dia, tipo, pasada: pasado })).join('')}
      </div>
    </section>`;
  }).join('');

  return `
    <header class="encabezado">
      <h1>Plan de la semana</h1>
      <p class="subtitulo">Ningún platillo se repite en la semana. Toca las flechas cruzadas para cambiar uno.</p>
    </header>
    <nav class="navegador-semana" aria-label="Cambiar de semana">
      <a class="btn btn--icono" href="#/semana?semana=${sumarDias(lunes, -7)}" aria-label="Semana anterior">${ICONOS.atras}</a>
      <strong>${rangoSemana(lunes)}<small>${nombreSemana}</small></strong>
      <a class="btn btn--icono" href="#/semana?semana=${sumarDias(lunes, 7)}" aria-label="Semana siguiente">${ICONOS.adelante}</a>
    </nav>
    ${avisoOcultos}
    ${dias}
    ${quedanDias ? `<div class="acciones-pie">
      <a class="btn btn--primario" href="#/compras?rango=semana&semana=${lunes}">${ICONOS.carrito} Lista de compras de esta semana</a>
      <button class="btn" type="button" data-accion="resortear">${ICONOS.aleatorio} Volver a sortear los días que faltan</button>
    </div>` : ''}`;
}

export const acciones = {
  otra: accionOtraOpcion,
  resortear(_boton, ctx) {
    if (!confirm('¿Volver a sortear de hoy al domingo? Cambiarán las comidas de esos días.')) return;
    volverASortearSemana(lunesPedido(ctx), claveFecha(new Date()));
    toast('Listo, semana sorteada de nuevo 🎲');
  },
};
