// Página principal: calendario de la semana (tira de 7 días + comidas del día elegido).

import { actualizacionDisponible, enApk, posponerActualizacion } from '../actualizaciones.js';
import { claveFecha, desdeClave, diasDeSemana, inicioSemana, nombreDia, rangoSemana, sumarDias } from '../fechas.js';
import { TIPOS } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { asegurarSemana, volverASortearSemana } from '../store.js';
import { esc, plural, toast } from '../util.js';
import { accionOtraOpcion, calendarioSemana, filaSlot } from './comun.js';

let diaSeleccionado = null; // día desplegado en el calendario
let listaCompleta = false; // mostrar los 7 días completos debajo del calendario
let actualizacion = null; // release más nueva que la APK instalada (se consulta en alMontar)

function lunesPedido({ params, ahora }) {
  const pedido = params.get('semana');
  return inicioSemana(/^\d{4}-\d{2}-\d{2}$/.test(pedido ?? '') ? pedido : claveFecha(ahora));
}

export function preparar(ctx) {
  asegurarSemana(lunesPedido(ctx), claveFecha(ctx.ahora));
}

function avisoActualizacion() {
  if (!actualizacion) return '';
  return `<section class="aviso aviso--actualizacion" data-aviso-actualizacion>
    <strong>📲 Nueva versión de la app (${esc(actualizacion.version)})</strong>
    <p class="nota">Toca Actualizar, espera la descarga y ábrela desde la notificación para instalarla encima. Tus recetas y tu plan se conservan.</p>
    <div class="fila-botones">
      <a class="btn btn--primario" href="${esc(actualizacion.url)}" target="_blank" rel="noopener">Actualizar</a>
      <button class="btn" type="button" data-accion="posponer">Ahora no</button>
    </div>
  </section>`;
}

function listaSemana(estado, lunes, hoy) {
  const porId = new Map(estado.recetas.map((r) => [r.id, r]));
  const conRegistro = (dia) => TIPOS.some((tipo) => porId.has(estado.plan[dia]?.[tipo]));
  const visibles = diasDeSemana(lunes).filter((dia) => dia >= hoy || conRegistro(dia));
  return visibles.map((dia) => {
    const pasado = dia < hoy;
    const clases = ['dia', dia === hoy && 'dia--hoy', pasado && 'dia--pasado'].filter(Boolean).join(' ');
    return `<section class="${clases}">
      <h2 class="dia__titulo">${nombreDia(dia)} ${desdeClave(dia).getDate()}${dia === hoy ? ' <span class="chip chip--comida">Hoy</span>' : ''}</h2>
      <div class="slots">
        ${TIPOS.map((tipo) => filaSlot({ receta: porId.get(estado.plan[dia]?.[tipo]), fecha: dia, tipo, pasada: pasado })).join('')}
      </div>
    </section>`;
  }).join('');
}

export function render(ctx) {
  const { estado, ahora, params } = ctx;
  const hoy = claveFecha(ahora);
  const lunes = lunesPedido(ctx);
  const lunesActual = inicioSemana(hoy);
  const quedanDias = sumarDias(lunes, 6) >= hoy;
  const nombreSemana = lunes === lunesActual ? 'Esta semana' : lunes > lunesActual ? 'Próxima semana' : 'Semana pasada';
  const seleccionado = params.get('dia') ?? diaSeleccionado;

  return `
    ${avisoActualizacion()}
    <header class="encabezado">
      <h1>${nombreSemana}</h1>
      <p class="subtitulo">Toca un día para ver sus comidas. Las flechas cruzadas cambian un platillo; en Recetas puedes agregar el que quieras a cualquier día.</p>
    </header>
    <nav class="navegador-semana" aria-label="Cambiar de semana">
      <a class="btn btn--icono" href="#/semana?semana=${sumarDias(lunes, -7)}" aria-label="Semana anterior">${ICONOS.atras}</a>
      <strong>${rangoSemana(lunes)}<small>${lunes === lunesActual ? 'Sin repetir platillos' : nombreSemana}</small></strong>
      <a class="btn btn--icono" href="#/semana?semana=${sumarDias(lunes, 7)}" aria-label="Semana siguiente">${ICONOS.adelante}</a>
    </nav>
    ${calendarioSemana({ estado, hoy, lunes, seleccionado })}
    <div class="acciones-pie">
      ${quedanDias ? `<a class="btn btn--primario" href="#/compras?rango=semana&semana=${lunes}">${ICONOS.carrito} Lista de compras de esta semana</a>` : ''}
      <a class="btn" href="#/recetas">${ICONOS.libro} Agregar una receta a un día</a>
      <button class="btn btn--texto" type="button" data-accion="lista-completa">${listaCompleta ? 'Ocultar los 7 días' : 'Ver los 7 días completos'}</button>
    </div>
    ${listaCompleta ? `${listaSemana(estado, lunes, hoy)}
    ${quedanDias ? `<button class="btn" type="button" data-accion="resortear">${ICONOS.aleatorio} Volver a sortear los días que faltan</button>` : ''}` : ''}`;
}

export function alMontar(_raiz, ctx) {
  if (!enApk() || actualizacion) return;
  actualizacionDisponible().then((release) => {
    if (!release) return;
    actualizacion = release;
    if (location.hash.startsWith('#/semana') || location.hash === '') ctx.repintar();
  });
}

export const acciones = {
  otra: accionOtraOpcion,
  dia(boton, ctx) {
    diaSeleccionado = boton.dataset.fecha;
    ctx.repintar();
  },
  'lista-completa'(_boton, ctx) {
    listaCompleta = !listaCompleta;
    ctx.repintar();
  },
  resortear(_boton, ctx) {
    if (!confirm('¿Volver a sortear de hoy al domingo? Cambiarán las comidas de esos días.')) return;
    volverASortearSemana(lunesPedido(ctx), claveFecha(new Date()));
    toast('Listo, semana sorteada de nuevo 🎲');
  },
  posponer(_boton, ctx) {
    posponerActualizacion(actualizacion.codigo);
    actualizacion = null;
    ctx.repintar();
  },
};
