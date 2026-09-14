// Recetas "del mismo estilo": se parecen por etiquetas, ingredientes principales y momento del día.
// Sirve para sugerir variantes de las favoritas sin necesidad de IA.

import { categorizar, normalizarTexto } from './porciones.js';

/** Ingredientes que definen el platillo (fuera sal, aceite, especias y otros de alacena). */
export function ingredientesClave(receta) {
  return new Set(
    (receta.ingredientes ?? [])
      .filter((ing) => (ing.categoria ?? categorizar(ing.nombre)) !== 'despensa')
      .map((ing) => normalizarTexto(ing.nombre)),
  );
}

/** Qué tanto se parecen dos recetas (0 = nada). */
export function parecido(a, b) {
  if (a.id === b.id) return 0;
  const etiquetasA = new Set(a.etiquetas ?? []);
  const etiquetasComunes = (b.etiquetas ?? []).filter((e) => etiquetasA.has(e)).length;
  const claveA = ingredientesClave(a);
  const ingredientesComunes = [...ingredientesClave(b)].filter((nombre) => claveA.has(nombre)).length;
  const mismoMomento = (a.tipos ?? []).some((t) => b.tipos?.includes(t)) ? 1 : 0;
  return etiquetasComunes * 2 + ingredientesComunes * 1.5 + mismoMomento;
}

const activas = (recetas) => recetas.filter((r) => r.activa !== false);

/** Las recetas más parecidas a una, de mayor a menor parecido. */
export function recetasParecidas(receta, recetas, maximo = 4) {
  return activas(recetas)
    .map((otra) => ({ receta: otra, puntos: parecido(receta, otra) }))
    .filter(({ puntos }) => puntos >= 3)
    .sort((x, y) => y.puntos - x.puntos || Number(y.receta.favorita) - Number(x.receta.favorita))
    .slice(0, maximo)
    .map(({ receta: r }) => r);
}

/**
 * Afinidad de una receta con las favoritas: 0 si no hay favoritas o no se parece a ninguna,
 * hasta 1 si se parece mucho a alguna. El sorteo la usa para dar más chance a ese estilo.
 */
export function afinidadConFavoritas(receta, recetas) {
  const favoritas = recetas.filter((r) => r.favorita && r.id !== receta.id);
  if (!favoritas.length) return 0;
  const mejor = Math.max(...favoritas.map((f) => parecido(receta, f)));
  return Math.min(mejor / 6, 1);
}

/** Recetas (no favoritas) del mismo estilo que las favoritas, ordenadas por afinidad. */
export function delEstiloDeFavoritas(recetas, maximo = 6) {
  return activas(recetas)
    .filter((r) => !r.favorita)
    .map((r) => ({ receta: r, afinidad: afinidadConFavoritas(r, recetas) }))
    .filter(({ afinidad }) => afinidad >= 0.5)
    .sort((x, y) => y.afinidad - x.afinidad)
    .slice(0, maximo)
    .map(({ receta }) => receta);
}
