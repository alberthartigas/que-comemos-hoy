// Forma canónica de una receta. Limpia y acota datos que vienen de fuera: formulario, respaldo o IA.
// No toca el navegador, así que el servidor de IA también lo usa para validar lo que devuelve el modelo.

import { TIPOS } from './horarios.js';
import { UNIDADES } from './porciones.js';
import { normalizarUrlTikTok } from './tiktok.js';

export const ETIQUETAS = ['Vegetariana', 'Alta en proteína', 'Ligera', 'Rica en fibra', 'Sin estufa', 'Para niños'];

const UNIDADES_VALIDAS = new Set(UNIDADES.map((u) => u.id));
const acotar = (n, min, max, defecto) => (Number.isFinite(Number(n)) ? Math.min(max, Math.max(min, Number(n))) : defecto);

export function sanearReceta(receta) {
  const ingredientes = (Array.isArray(receta.ingredientes) ? receta.ingredientes : [])
    .filter((ing) => String(ing?.nombre ?? '').trim())
    .map((ing) => ({
      nombre: String(ing.nombre).trim().slice(0, 60),
      cantidad: acotar(ing.cantidad, 0, 100000, 0),
      unidad: UNIDADES_VALIDAS.has(ing.unidad) ? ing.unidad : 'pza',
      ...(Number(ing.paso) > 0 ? { paso: Number(ing.paso) } : {}),
    }));
  return {
    id: String(receta.id),
    nombre: String(receta.nombre ?? '').trim().slice(0, 80) || 'Receta sin nombre',
    emoji: typeof receta.emoji === 'string' && receta.emoji.trim() && receta.emoji.length <= 16 ? receta.emoji.trim() : '🍽️',
    tipos: TIPOS.filter((tipo) => receta.tipos?.includes(tipo)),
    minutos: Math.round(acotar(receta.minutos, 0, 600, 0)),
    etiquetas: Array.isArray(receta.etiquetas) ? receta.etiquetas.map(String).slice(0, 10) : [],
    tip: receta.tip ? String(receta.tip).slice(0, 240) : '',
    ingredientes,
    pasos: (Array.isArray(receta.pasos) ? receta.pasos : []).map((p) => String(p).trim()).filter(Boolean).slice(0, 30),
    tiktok: normalizarUrlTikTok(receta.tiktok),
    origen: receta.origen === 'base' ? 'base' : 'propia',
    activa: receta.activa !== false,
    favorita: receta.favorita === true,
  };
}
