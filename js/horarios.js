// Regla de horario: según la hora del celular decide si toca desayuno, comida o cena.

import { claveFecha, sumarDias } from './fechas.js';

export const TIPOS = ['desayuno', 'comida', 'cena'];

/** Comidas que la persona hace al día (Ajustes → ¿Qué comidas haces?). De fábrica, las tres. */
export const tiposActivos = (ajustes) => TIPOS.filter((tipo) => ajustes?.comidas?.[tipo] !== false);

export const INFO_TIPO = {
  desayuno: { nombre: 'Desayuno', emoji: '☀️', articulo: 'el' },
  comida: { nombre: 'Comida', emoji: '🍲', articulo: 'la' },
  cena: { nombre: 'Cena', emoji: '🌙', articulo: 'la' },
};

export const HORARIOS_DEFECTO = {
  desayuno: { inicio: '05:00', fin: '11:59' },
  comida: { inicio: '12:00', fin: '17:59' },
  cena: { inicio: '18:00', fin: '22:59' },
};

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function aMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Devuelve horarios completos y válidos, usando los de fábrica donde falte algo. */
export function normalizarHorarios(horarios = {}) {
  const resultado = {};
  for (const tipo of TIPOS) {
    const rango = horarios[tipo] ?? {};
    resultado[tipo] = {
      inicio: HORA_VALIDA.test(rango.inicio) ? rango.inicio : HORARIOS_DEFECTO[tipo].inicio,
      fin: HORA_VALIDA.test(rango.fin) ? rango.fin : HORARIOS_DEFECTO[tipo].fin,
    };
  }
  return resultado;
}

const cruzaMedianoche = (rango) => aMinutos(rango.inicio) > aMinutos(rango.fin);

function estaDentro(minuto, rango) {
  const inicio = aMinutos(rango.inicio);
  const fin = aMinutos(rango.fin);
  return cruzaMedianoche(rango) ? minuto >= inicio || minuto <= fin : minuto >= inicio && minuto <= fin;
}

/**
 * Qué toca a esta hora.
 * - Dentro de un rango: { tipo, fecha, estado: 'ahora' }.
 * - Fuera de todos (p. ej. 23:30 o 03:00): la siguiente que empieza, { estado: 'siguiente' },
 *   con la fecha de mañana si empieza después de medianoche.
 */
export function tipoSegunHora(ahora, horariosEntrada) {
  const horarios = normalizarHorarios(horariosEntrada);
  const minuto = ahora.getHours() * 60 + ahora.getMinutes();
  const hoy = claveFecha(ahora);

  for (const tipo of TIPOS) {
    const rango = horarios[tipo];
    if (estaDentro(minuto, rango)) {
      // En un rango que cruza medianoche (cena 20:00–01:00), la madrugada pertenece al día anterior.
      const esMadrugada = cruzaMedianoche(rango) && minuto <= aMinutos(rango.fin);
      return { tipo, fecha: esMadrugada ? sumarDias(hoy, -1) : hoy, estado: 'ahora' };
    }
  }

  let siguiente = null;
  for (const tipo of TIPOS) {
    const espera = (aMinutos(horarios[tipo].inicio) - minuto + 1440) % 1440;
    if (!siguiente || espera < siguiente.espera) siguiente = { tipo, espera };
  }
  const fecha = minuto + siguiente.espera >= 1440 ? sumarDias(hoy, 1) : hoy;
  return { tipo: siguiente.tipo, fecha, estado: 'siguiente', empieza: horarios[siguiente.tipo].inicio };
}

export function saludo(ahora) {
  const h = ahora.getHours();
  if (h >= 5 && h < 12) return '¡Buenos días!';
  if (h >= 12 && h < 19) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}
