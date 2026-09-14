// Planeador: elige recetas al azar respetando las reglas de no repetición.
// plan = { 'YYYY-MM-DD': { desayuno?: idReceta, comida?: idReceta, cena?: idReceta } }

import { TIPOS } from './horarios.js';
import { diasDeSemana, diasEntre, inicioSemana, sumarDias } from './fechas.js';
import { afinidadConFavoritas } from './similares.js';

const DIAS_PARA_PESO_MAXIMO = 28;

/** Recetas activas que pueden salir en ese tipo de comida. */
export function candidatas(recetas, tipo) {
  return recetas.filter((r) => r.activa !== false && r.tipos?.includes(tipo));
}

function idsDelDia(plan, fecha, exceptoTipo) {
  const dia = plan[fecha] ?? {};
  return new Set(TIPOS.filter((t) => t !== exceptoTipo).map((t) => dia[t]).filter(Boolean));
}

function idsDeLaSemana(plan, fecha, exceptoTipo) {
  const ids = new Set();
  for (const dia of diasDeSemana(fecha)) {
    for (const tipo of TIPOS) {
      if (dia === fecha && tipo === exceptoTipo) continue;
      const id = plan[dia]?.[tipo];
      if (id) ids.add(id);
    }
  }
  return ids;
}

/** Para cada receta: cuántos días hay hasta la vez más cercana que salió (antes o después), sin contar este espacio. */
function distanciasDeUso(plan, fecha, exceptoTipo) {
  const distancias = new Map();
  for (const [dia, comidas] of Object.entries(plan)) {
    for (const tipo of TIPOS) {
      const id = comidas?.[tipo];
      if (!id || (dia === fecha && tipo === exceptoTipo)) continue;
      const distancia = Math.abs(diasEntre(dia, fecha));
      if (!distancias.has(id) || distancia < distancias.get(id)) distancias.set(id, distancia);
    }
  }
  return distancias;
}

function elegirPonderado(opciones, pesos, rng) {
  const total = pesos.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < opciones.length; i++) {
    x -= pesos[i];
    if (x < 0) return opciones[i];
  }
  return opciones[opciones.length - 1];
}

/**
 * Elige receta para (fecha, tipo):
 * 1. Nunca repite receta en el mismo día.
 * 2. No repite en la misma semana (lunes a domingo) mientras haya opciones.
 * 3. Si ya salieron todas, repite la que salió hace más tiempo y lo avisa con `repetida: true`.
 * Es al azar, pero favorece las que llevan más días sin salir, las favoritas (x2) y las del
 * mismo estilo que las favoritas (hasta x1.5).
 */
export function elegirReceta({ recetas, plan, fecha, tipo, excluir = [], rng = Math.random }) {
  const delDia = idsDelDia(plan, fecha, tipo);
  const disponibles = candidatas(recetas, tipo).filter((r) => !delDia.has(r.id) && !excluir.includes(r.id));
  if (!disponibles.length) return { id: null, repetida: false };

  const deLaSemana = idsDeLaSemana(plan, fecha, tipo);
  const distancias = distanciasDeUso(plan, fecha, tipo);
  const nuevas = disponibles.filter((r) => !deLaSemana.has(r.id));

  if (nuevas.length) {
    const pesos = nuevas.map((r) => {
      const dias = Math.min(distancias.get(r.id) ?? DIAS_PARA_PESO_MAXIMO, DIAS_PARA_PESO_MAXIMO);
      const estilo = r.favorita ? 2 : 1 + 0.5 * afinidadConFavoritas(r, recetas);
      return (1 + dias) * estilo;
    });
    return { id: elegirPonderado(nuevas, pesos, rng).id, repetida: false };
  }

  const masLejana = Math.max(...disponibles.map((r) => distancias.get(r.id) ?? 0));
  const empatadas = disponibles.filter((r) => (distancias.get(r.id) ?? 0) === masLejana);
  return { id: empatadas[Math.floor(rng() * empatadas.length)].id, repetida: true };
}

function asignar(plan, fecha, tipo, id) {
  const dia = { ...(plan[fecha] ?? {}) };
  if (id) dia[tipo] = id;
  else delete dia[tipo];
  return { ...plan, [fecha]: dia };
}

/**
 * Llena los espacios vacíos o inválidos de un día (receta borrada, desactivada, que ya no es de ese
 * tipo o repetida en el mismo día). Si no cambia nada devuelve el mismo objeto `plan`.
 */
export function completarDia({ recetas, plan, fecha, rng = Math.random }) {
  const porId = new Map(recetas.map((r) => [r.id, r]));
  let nuevoPlan = plan;
  TIPOS.forEach((tipo, i) => {
    const dia = nuevoPlan[fecha] ?? {};
    const id = dia[tipo];
    const receta = porId.get(id);
    const valida = receta && receta.activa !== false && receta.tipos?.includes(tipo);
    const repetidaEnElDia = TIPOS.slice(0, i).some((anterior) => dia[anterior] === id);
    if (valida && !repetidaEnElDia) return;

    const { id: nuevoId } = elegirReceta({ recetas, plan: nuevoPlan, fecha, tipo, rng });
    if (nuevoId !== (id ?? null)) nuevoPlan = asignar(nuevoPlan, fecha, tipo, nuevoId);
  });
  return nuevoPlan;
}

/** Llena la semana de `fecha` desde `desde` en adelante: los días pasados no se tocan para no gastar recetas. */
export function completarSemana({ recetas, plan, fecha, desde, rng = Math.random }) {
  return diasDeSemana(fecha)
    .filter((dia) => !desde || dia >= desde)
    .reduce((acumulado, dia) => completarDia({ recetas, plan: acumulado, fecha: dia, rng }), plan);
}

/**
 * "Otra opción": cambia la receta de un espacio. `vistas` son las que la persona ya descartó en esta
 * sesión, para no regresarle la misma; si ya se agotaron, solo se evita la actual.
 */
export function cambiarReceta({ recetas, plan, fecha, tipo, vistas = [], rng = Math.random }) {
  const actual = plan[fecha]?.[tipo] ?? null;
  const evitar = actual ? [actual] : [];
  let eleccion = elegirReceta({ recetas, plan, fecha, tipo, excluir: [...new Set([...evitar, ...vistas])], rng });
  if (!eleccion.id && vistas.length) eleccion = elegirReceta({ recetas, plan, fecha, tipo, excluir: evitar, rng });
  if (!eleccion.id) return { plan, id: actual, cambio: false, repetida: false };
  return { plan: asignar(plan, fecha, tipo, eleccion.id), id: eleccion.id, cambio: true, repetida: eleccion.repetida };
}

/** La persona elige a mano una receta para un espacio. Si ya estaba en otro espacio del mismo día, ese queda libre. */
export function fijarReceta({ plan, fecha, tipo, id }) {
  let nuevoPlan = plan;
  for (const otro of TIPOS) {
    if (otro !== tipo && nuevoPlan[fecha]?.[otro] === id) nuevoPlan = asignar(nuevoPlan, fecha, otro, null);
  }
  return asignar(nuevoPlan, fecha, tipo, id);
}

/** Borra los días de la semana indicada desde `desde` para volver a sortearlos. */
export function reiniciarSemana({ plan, fecha, desde }) {
  const nuevoPlan = { ...plan };
  for (const dia of diasDeSemana(fecha)) {
    if (!desde || dia >= desde) delete nuevoPlan[dia];
  }
  return nuevoPlan;
}

/** Conserva solo las últimas `semanas` de historial (sirven para no repetir entre semanas). */
export function recortarHistorial(plan, hoy, semanas = 8) {
  const limite = sumarDias(inicioSemana(hoy), -7 * semanas);
  const dias = Object.keys(plan);
  const conservar = dias.filter((dia) => dia >= limite);
  if (conservar.length === dias.length) return plan;
  return Object.fromEntries(conservar.map((dia) => [dia, plan[dia]]));
}
