// Estado de la app guardado en este dispositivo (localStorage) y las acciones que lo modifican.

import { RECETAS_BASE, VERSION_BASE } from '../data/recetas-base.js';
import { claveFecha, inicioSemana, sumarDias } from './fechas.js';
import { HORARIOS_DEFECTO, normalizarHorarios } from './horarios.js';
import { FACTOR_ADULTO_DEFECTO, FACTOR_NINO_DEFECTO } from './porciones.js';
import { cambiarReceta, completarDia, completarSemana, fijarReceta, recortarHistorial, reiniciarSemana } from './planner.js';
import { sanearReceta } from './recetas.js';

const CLAVE_ALMACEN = 'que-comemos-hoy:v1';

const copiar = (valor) => JSON.parse(JSON.stringify(valor));
const acotar = (n, min, max, defecto) => (Number.isFinite(Number(n)) ? Math.min(max, Math.max(min, Number(n))) : defecto);
const esObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

function estadoVacio() {
  return {
    version: 1,
    versionBase: 0,
    recetas: [],
    baseEliminadas: [],
    ajustes: {
      adultos: 2,
      ninos: 0,
      factorAdulto: FACTOR_ADULTO_DEFECTO,
      factorNino: FACTOR_NINO_DEFECTO,
      horarios: copiar(HORARIOS_DEFECTO),
    },
    plan: {},
    compras: {},
  };
}

/** Completa y corrige cualquier estado (guardado viejo, archivo importado) para que la app no truene. */
export function sanearEstado(datos) {
  const vacio = estadoVacio();
  if (!esObjeto(datos)) return vacio;
  const ajustes = { ...vacio.ajustes, ...(esObjeto(datos.ajustes) ? datos.ajustes : {}) };
  ajustes.adultos = Math.round(acotar(ajustes.adultos, 0, 20, 2));
  ajustes.ninos = Math.round(acotar(ajustes.ninos, 0, 20, 0));
  if (ajustes.adultos + ajustes.ninos === 0) ajustes.adultos = 1;
  ajustes.factorAdulto = acotar(ajustes.factorAdulto, 0.5, 2, FACTOR_ADULTO_DEFECTO);
  ajustes.factorNino = acotar(ajustes.factorNino, 0.3, 1, FACTOR_NINO_DEFECTO);
  ajustes.horarios = normalizarHorarios(ajustes.horarios);

  const vistos = new Set();
  const recetas = (Array.isArray(datos.recetas) ? datos.recetas : [])
    .filter((r) => esObjeto(r) && r.id != null && !vistos.has(String(r.id)) && vistos.add(String(r.id)))
    .map(sanearReceta);

  return {
    ...vacio,
    versionBase: Number(datos.versionBase) || 0,
    recetas,
    baseEliminadas: Array.isArray(datos.baseEliminadas) ? datos.baseEliminadas.map(String) : [],
    ajustes,
    plan: esObjeto(datos.plan) ? datos.plan : {},
    compras: esObjeto(datos.compras) ? datos.compras : {},
  };
}

/** Agrega las recetas base que falten (sin revivir las que la persona borró) y los videos de TikTok nuevos. */
export function agregarRecetasBase(estado) {
  if (estado.versionBase >= VERSION_BASE) return estado;
  const eliminadas = new Set(estado.baseEliminadas);
  const basePorId = new Map(RECETAS_BASE.map((r) => [r.id, r]));
  const existentes = new Set(estado.recetas.map((r) => r.id));
  const actualizadas = estado.recetas.map((r) =>
    r.origen === 'base' && !r.tiktok && basePorId.get(r.id)?.tiktok ? { ...r, tiktok: basePorId.get(r.id).tiktok } : r);
  const nuevas = RECETAS_BASE.filter((r) => !existentes.has(r.id) && !eliminadas.has(r.id)).map(copiar);
  return { ...estado, recetas: [...actualizadas, ...nuevas], versionBase: VERSION_BASE };
}

function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ALMACEN));
  } catch {
    return null;
  }
}

let estado = agregarRecetasBase(sanearEstado(leerGuardado()));
let avisoGuardado = null;
const oyentes = new Set();

function guardar() {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(estado));
    avisoGuardado = null;
  } catch {
    avisoGuardado = 'No se pudo guardar en este dispositivo (¿modo incógnito o sin espacio?).';
  }
}
guardar();

export { sanearReceta };
export const obtenerEstado = () => estado;
export const errorDeGuardado = () => avisoGuardado;

export function suscribir(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

function actualizar(transformar) {
  const nuevo = transformar(estado);
  if (nuevo === estado) return;
  estado = nuevo;
  guardar();
  oyentes.forEach((oyente) => oyente(estado));
}

// ---------- Plan ----------

function limpiarComprasViejas(compras, hoy) {
  const limite = sumarDias(inicioSemana(hoy), -7);
  const claves = Object.keys(compras);
  const conservar = claves.filter((clave) => (clave.split(':')[1] ?? '') >= limite);
  return conservar.length === claves.length ? compras : Object.fromEntries(conservar.map((c) => [c, compras[c]]));
}

/** Garantiza que la semana de `fecha` tenga plan desde hoy en adelante (y corrige recetas borradas o desactivadas). */
export function asegurarSemana(fecha, hoy = claveFecha()) {
  actualizar((e) => {
    const plan = completarSemana({ recetas: e.recetas, plan: recortarHistorial(e.plan, hoy), fecha, desde: hoy });
    const compras = limpiarComprasViejas(e.compras, hoy);
    return plan === e.plan && compras === e.compras ? e : { ...e, plan, compras };
  });
}

/** "Otra opción" para un espacio. Devuelve { cambio, repetida }. */
export function otraOpcion(fecha, tipo, vistas = []) {
  let resultado = { cambio: false, repetida: false };
  actualizar((e) => {
    resultado = cambiarReceta({ recetas: e.recetas, plan: e.plan, fecha, tipo, vistas });
    return resultado.cambio ? { ...e, plan: resultado.plan } : e;
  });
  return resultado;
}

export function usarRecetaEn(fecha, tipo, id) {
  actualizar((e) => {
    const plan = completarDia({ recetas: e.recetas, plan: fijarReceta({ plan: e.plan, fecha, tipo, id }), fecha });
    return { ...e, plan };
  });
}

export function volverASortearSemana(fecha, hoy = claveFecha()) {
  actualizar((e) => {
    const limpio = reiniciarSemana({ plan: e.plan, fecha, desde: hoy });
    return { ...e, plan: completarSemana({ recetas: e.recetas, plan: limpio, fecha, desde: hoy }) };
  });
}

// ---------- Recetas ----------

export function nuevoIdReceta() {
  return `propia-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function guardarReceta(receta) {
  const limpia = sanearReceta(receta);
  actualizar((e) => {
    const existe = e.recetas.some((r) => r.id === limpia.id);
    const recetas = existe ? e.recetas.map((r) => (r.id === limpia.id ? limpia : r)) : [limpia, ...e.recetas];
    return { ...e, recetas };
  });
  return limpia;
}

export function eliminarReceta(id) {
  actualizar((e) => {
    const receta = e.recetas.find((r) => r.id === id);
    if (!receta) return e;
    return {
      ...e,
      recetas: e.recetas.filter((r) => r.id !== id),
      baseEliminadas: receta.origen === 'base' ? [...new Set([...e.baseEliminadas, id])] : e.baseEliminadas,
    };
  });
}

function cambiarCampo(id, campo) {
  actualizar((e) => ({ ...e, recetas: e.recetas.map((r) => (r.id === id ? { ...r, [campo]: !r[campo] } : r)) }));
}

export const alternarActiva = (id) => cambiarCampo(id, 'activa');
export const alternarFavorita = (id) => cambiarCampo(id, 'favorita');

export function restaurarRecetasBase() {
  actualizar((e) => agregarRecetasBase({ ...e, baseEliminadas: [], versionBase: 0 }));
}

// ---------- Ajustes, compras y respaldo ----------

export function actualizarAjustes(cambios) {
  actualizar((e) => sanearEstado({ ...e, ajustes: { ...e.ajustes, ...cambios } }));
}

export function alternarCompra(lista, clave) {
  actualizar((e) => {
    const marcadas = new Set(e.compras[lista] ?? []);
    if (marcadas.has(clave)) marcadas.delete(clave);
    else marcadas.add(clave);
    return { ...e, compras: { ...e.compras, [lista]: [...marcadas] } };
  });
}

export function desmarcarCompras(lista) {
  actualizar((e) => ({ ...e, compras: { ...e.compras, [lista]: [] } }));
}

export function exportarDatos() {
  return JSON.stringify({ app: 'que-comemos-hoy', exportado: new Date().toISOString(), ...estado }, null, 2);
}

/** Reemplaza todo con un respaldo. Lanza error si el archivo no es de esta app. */
export function importarDatos(texto) {
  const datos = JSON.parse(texto);
  if (!esObjeto(datos) || !Array.isArray(datos.recetas)) throw new Error('El archivo no parece un respaldo de esta app.');
  actualizar(() => agregarRecetasBase(sanearEstado(datos)));
}

export function borrarTodo() {
  actualizar(() => agregarRecetasBase(estadoVacio()));
}
