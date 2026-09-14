// Pantalla de inicio: qué toca ahora según la hora y el resto del día.

import { claveFecha, fechaLarga } from '../fechas.js';
import { INFO_TIPO, TIPOS, saludo, tipoSegunHora } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { asegurarSemana } from '../store.js';
import { esc, textoPersonas } from '../util.js';
import { accionOtraOpcion, claseAnimacion, enlaceReceta, enlaceTikTok, filaSlot } from './comun.js';

export function preparar({ ahora, estado }) {
  const hoy = claveFecha(ahora);
  const momento = tipoSegunHora(ahora, estado.ajustes.horarios);
  asegurarSemana(hoy, hoy);
  if (momento.fecha !== hoy) asegurarSemana(momento.fecha, momento.fecha < hoy ? momento.fecha : hoy);
}

function tarjetaPrincipal(receta, momento) {
  const info = INFO_TIPO[momento.tipo];
  if (!receta) {
    return `<div class="vacio">
      <span class="vacio__emoji">${info.emoji}</span>
      <p>No hay recetas de ${info.nombre.toLowerCase()} para sugerir.</p>
      <a class="btn btn--primario" href="#/nueva?tipo=${momento.tipo}">Agregar una receta</a>
    </div>`;
  }
  const enlace = enlaceReceta(receta.id, momento.fecha, momento.tipo);
  return `
    <a class="hero__cuerpo" href="${enlace}">
      <span class="hero__emoji${claseAnimacion(momento.fecha, momento.tipo)}">${esc(receta.emoji)}</span>
      <h2 class="hero__titulo">${esc(receta.nombre)}</h2>
      <p class="meta">
        ${receta.minutos ? `<span>${ICONOS.reloj} ${receta.minutos} min</span>` : ''}
        <span>${receta.ingredientes.length} ingredientes</span>
        ${receta.favorita ? `<span class="corazon">${ICONOS.corazon} Favorita</span>` : ''}
      </p>
      ${receta.etiquetas.length ? `<span class="chips">${receta.etiquetas.map((e) => `<span class="chip chip--verde">${esc(e)}</span>`).join('')}</span>` : ''}
    </a>
    <div class="hero__acciones">
      <a class="btn btn--primario btn--bloque" href="${enlace}">Ver ingredientes y receta</a>
      <div class="fila-botones">
        <button class="btn" type="button" data-accion="otra" data-fecha="${momento.fecha}" data-tipo="${momento.tipo}">${ICONOS.aleatorio} Otra opción</button>
        <a class="btn btn--tiktok" href="${esc(enlaceTikTok(receta))}" target="_blank" rel="noopener">${ICONOS.play} TikTok</a>
      </div>
    </div>`;
}

export function render({ ahora, estado }) {
  const { ajustes, plan, recetas } = estado;
  const hoy = claveFecha(ahora);
  const momento = tipoSegunHora(ahora, ajustes.horarios);
  const info = INFO_TIPO[momento.tipo];
  const rango = ajustes.horarios[momento.tipo];
  const porId = new Map(recetas.map((r) => [r.id, r]));
  const recetaDe = (fecha, tipo) => porId.get(plan[fecha]?.[tipo]);

  const etiqueta = momento.estado === 'ahora'
    ? `Ahora toca ${info.nombre.toLowerCase()}`
    : `${momento.fecha === hoy ? 'Más tarde' : 'Mañana'}: ${info.nombre.toLowerCase()}`;

  // Pasada la medianoche con una cena que cruza el día, el resto muestra el día nuevo completo.
  const fechaResto = momento.fecha < hoy ? hoy : momento.fecha;
  const tiposResto = momento.fecha < hoy ? TIPOS : TIPOS.filter((t) => t !== momento.tipo);
  const tituloResto = momento.fecha < hoy ? 'Hoy' : momento.fecha === hoy ? 'El resto del día' : 'Mañana también';
  const yaPaso = (tipo) => fechaResto === hoy && momento.fecha === hoy && TIPOS.indexOf(tipo) < TIPOS.indexOf(momento.tipo);

  return `
    <header class="encabezado">
      <p class="saludo">${saludo(ahora)}</p>
      <h1>${fechaLarga(hoy)}</h1>
      <a class="chip" href="#/ajustes">${ICONOS.personas} ${textoPersonas(ajustes)}</a>
    </header>

    <section class="hero hero--${momento.tipo}" aria-label="Sugerencia principal">
      <div class="hero__banda">
        <span>${info.emoji} ${etiqueta}</span>
        <span class="hero__horario">${rango.inicio} – ${rango.fin}</span>
      </div>
      ${tarjetaPrincipal(recetaDe(momento.fecha, momento.tipo), momento)}
    </section>

    <h2 class="seccion-titulo">${tituloResto}</h2>
    <div class="slots">
      ${tiposResto.map((tipo) => filaSlot({ receta: recetaDe(fechaResto, tipo), fecha: fechaResto, tipo, pasada: yaPaso(tipo) })).join('')}
    </div>

    <div class="accesos">
      <a class="acceso" href="#/compras?rango=dia"><span class="acceso__emoji">🛒</span>Compras de hoy<small>Para ${textoPersonas(ajustes)}</small></a>
      <a class="acceso" href="#/semana"><span class="acceso__emoji">📅</span>Plan de la semana<small>Sin repetir platillos</small></a>
    </div>`;
}

export const acciones = { otra: accionOtraOpcion };
