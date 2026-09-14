// Porciones: escala ingredientes según adultos y niños, redondea a cantidades que sí se pueden
// comprar y arma la lista de compras agrupada por pasillo.

export const UNIDADES = [
  { id: 'pza', singular: 'pza', plural: 'pzas', paso: 0.5 },
  { id: 'g', singular: 'g', plural: 'g', paso: 10 },
  { id: 'kg', singular: 'kg', plural: 'kg', paso: 0.05 },
  { id: 'ml', singular: 'ml', plural: 'ml', paso: 10 },
  { id: 'l', singular: 'litro', plural: 'litros', paso: 0.25 },
  { id: 'taza', singular: 'taza', plural: 'tazas', paso: 0.25 },
  { id: 'cda', singular: 'cda', plural: 'cdas', paso: 0.5 },
  { id: 'cdita', singular: 'cdita', plural: 'cditas', paso: 0.25 },
  { id: 'rebanada', singular: 'rebanada', plural: 'rebanadas', paso: 1 },
  { id: 'diente', singular: 'diente', plural: 'dientes', paso: 1 },
  { id: 'lata', singular: 'lata', plural: 'latas', paso: 0.5 },
  { id: 'paquete', singular: 'paquete', plural: 'paquetes', paso: 0.5 },
  { id: 'manojo', singular: 'manojo', plural: 'manojos', paso: 0.25 },
  { id: 'hoja', singular: 'hoja', plural: 'hojas', paso: 1 },
  { id: 'gusto', singular: 'al gusto', plural: 'al gusto', paso: 0 },
];

const INFO_UNIDAD = Object.fromEntries(UNIDADES.map((u) => [u.id, u]));
export const infoUnidad = (id) => INFO_UNIDAD[id] ?? INFO_UNIDAD.pza;

export const FACTOR_ADULTO_DEFECTO = 1;
export const FACTOR_NINO_DEFECTO = 0.6;

const limpiar = (n) => Math.round(n * 1000) / 1000;

/** Porciones de adulto equivalentes. Ej.: 2 adultos + 2 niños al 60% = 3.2 porciones. */
export function porcionesTotales({ adultos = 0, ninos = 0, factorAdulto = FACTOR_ADULTO_DEFECTO, factorNino = FACTOR_NINO_DEFECTO } = {}) {
  const total = adultos * factorAdulto + ninos * factorNino;
  return total > 0 ? limpiar(total) : 1;
}

/** kg y litros se guardan como g y ml para poder sumarlos en la lista de compras. */
export function normalizarIngrediente(ingrediente) {
  const cantidad = Number(ingrediente.cantidad) || 0;
  if (ingrediente.unidad === 'kg') return { ...ingrediente, cantidad: cantidad * 1000, unidad: 'g' };
  if (ingrediente.unidad === 'l') return { ...ingrediente, cantidad: cantidad * 1000, unidad: 'ml' };
  return { ...ingrediente, cantidad, unidad: INFO_UNIDAD[ingrediente.unidad] ? ingrediente.unidad : 'pza' };
}

function pasoPara(cantidad, unidad, pasoIngrediente) {
  if (pasoIngrediente > 0) return pasoIngrediente;
  if (unidad === 'g' || unidad === 'ml') return cantidad < 50 ? 5 : cantidad < 1000 ? 10 : 50;
  return infoUnidad(unidad).paso;
}

/** Redondea hacia arriba al paso de la unidad: mejor que sobre un poco a que falte. */
export function redondear(cantidad, unidad, pasoIngrediente) {
  if (!(cantidad > 0) || unidad === 'gusto') return 0;
  const paso = pasoPara(cantidad, unidad, pasoIngrediente);
  return limpiar(Math.ceil(limpiar(cantidad / paso)) * paso);
}

const FRACCIONES = [[0.25, '¼'], [0.5, '½'], [0.75, '¾']];

export function formatoNumero(n) {
  const entero = Math.floor(n + 1e-9);
  const resto = limpiar(n - entero);
  if (resto === 0) return String(entero);
  const fraccion = FRACCIONES.find(([valor]) => Math.abs(valor - resto) < 0.01);
  if (fraccion) return entero ? `${entero} ${fraccion[1]}` : fraccion[1];
  return String(Math.round(n * 100) / 100);
}

export function formatoCantidad(cantidad, unidad) {
  if (unidad === 'gusto' || !(cantidad > 0)) return 'al gusto';
  if (unidad === 'g' && cantidad >= 1000) return `${limpiar(cantidad / 1000)} kg`;
  if (unidad === 'ml' && cantidad >= 1000) return `${limpiar(cantidad / 1000)} l`;
  const info = infoUnidad(unidad);
  return `${formatoNumero(cantidad)} ${cantidad > 1 ? info.plural : info.singular}`;
}

/** Ingredientes de una receta (definidos para 1 adulto) multiplicados por las porciones. */
export function escalarIngredientes(ingredientes = [], porciones = 1) {
  return ingredientes.map((original) => {
    const ing = normalizarIngrediente(original);
    const total = redondear(ing.cantidad * porciones, ing.unidad, ing.paso);
    return { ...ing, total, texto: formatoCantidad(total, ing.unidad) };
  });
}

// ---------- Lista de compras ----------

export const CATEGORIAS = [
  { id: 'verduras', nombre: 'Frutas y verduras', emoji: '🥬' },
  { id: 'carnes', nombre: 'Pollo, carne y pescado', emoji: '🍗' },
  { id: 'lacteos', nombre: 'Lácteos, huevo y salchichonería', emoji: '🥚' },
  { id: 'tortilleria', nombre: 'Tortillas, pan y cereales', emoji: '🌽' },
  { id: 'abarrotes', nombre: 'Abarrotes y enlatados', emoji: '🥫' },
  { id: 'otros', nombre: 'Otros', emoji: '🛒' },
  { id: 'despensa', nombre: 'Revisa tu alacena', emoji: '🧂' },
];

// Se evalúan en orden y gana la primera coincidencia: "atún en lata" es abarrote antes que pescado,
// "crema de cacahuate" es abarrote antes que lácteo. Aceptan plural (s/es).
const PALABRAS_CLAVE = [
  ['despensa', ['sal', 'pimienta', 'aceite', 'canela', 'oregano', 'comino', 'ajo en polvo', 'cebolla en polvo',
    'vinagre', 'paprika', 'consome', 'laurel', 'tomillo', 'vainilla', 'polvo para hornear', 'bicarbonato', 'azucar',
    'salsa inglesa', 'jugo sazonador', 'miel', 'mostaza', 'mayonesa', 'caldo en polvo', 'chile en polvo']],
  ['abarrotes', ['atun', 'frijol', 'lenteja', 'garbanzo', 'salsa', 'pure de tomate', 'chipotle', 'crema de cacahuate',
    'chia', 'granola', 'caldo', 'aceituna', 'nuez', 'almendra', 'cacahuate', 'pasa', 'catsup', 'elote en lata']],
  ['tortilleria', ['tortilla', 'tostada', 'totopo', 'pan', 'bolillo', 'telera', 'avena', 'arroz', 'espagueti', 'pasta',
    'pan molido', 'harina', 'pan arabe', 'cereal']],
  ['carnes', ['pollo', 'pechuga', 'muslo', 'res', 'bistec', 'carne', 'cerdo', 'pescado', 'tilapia', 'salmon',
    'camaron', 'filete']],
  ['lacteos', ['huevo', 'clara', 'queso', 'yogur', 'yogurt', 'leche', 'crema', 'mantequilla', 'jamon', 'requeson']],
  ['verduras', ['platano', 'fresa', 'manzana', 'mango', 'papaya', 'jitomate', 'tomate', 'cebolla', 'chile', 'cilantro',
    'aguacate', 'limon', 'espinaca', 'lechuga', 'pepino', 'zanahoria', 'papa', 'calabacita', 'calabaza', 'brocoli',
    'pimiento', 'champinon', 'nopal', 'col', 'chicharo', 'elote', 'ajo', 'apio', 'chayote', 'epazote', 'perejil',
    'frutos rojos', 'ejote', 'coliflor', 'naranja', 'pina', 'melon', 'uva', 'kiwi', 'berenjena', 'betabel', 'rabano',
    'verdura', 'fruta', 'hierbabuena', 'arugula']],
];

export function normalizarTexto(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const REGLAS = PALABRAS_CLAVE.map(([categoria, palabras]) => [
  categoria,
  palabras.map((palabra) => new RegExp(`(?:^|\\s)${palabra}(?:e?s)?(?=\\s|$)`)),
]);

export function categorizar(nombre) {
  const texto = normalizarTexto(nombre);
  for (const [categoria, patrones] of REGLAS) {
    if (patrones.some((patron) => patron.test(texto))) return categoria;
  }
  return 'otros';
}

/**
 * entradas: [{ receta, porciones }], una por cada comida planeada.
 * Suma primero y redondea al final, así 3 recetas con ⅓ de cebolla piden 1 cebolla y no 3.
 * Devuelve grupos por pasillo: [{ id, nombre, emoji, items: [{ clave, nombre, texto, recetas }] }].
 */
export function listaDeCompras(entradas) {
  const items = new Map();
  for (const { receta, porciones } of entradas) {
    for (const original of receta.ingredientes ?? []) {
      const ing = normalizarIngrediente(original);
      if (!ing.nombre?.trim()) continue;
      const clave = `${normalizarTexto(ing.nombre)}|${ing.unidad}`;
      let item = items.get(clave);
      if (!item) {
        item = { clave, nombre: ing.nombre.trim(), unidad: ing.unidad, cantidad: 0, paso: 0,
          categoria: ing.categoria ?? categorizar(ing.nombre), recetas: [] };
        items.set(clave, item);
      }
      item.cantidad += ing.cantidad * porciones;
      item.paso = Math.max(item.paso, ing.paso ?? 0);
      if (!item.recetas.includes(receta.nombre)) item.recetas.push(receta.nombre);
    }
  }

  const lista = [...items.values()].map((item) => {
    const total = redondear(item.cantidad, item.unidad, item.paso);
    return { ...item, total, texto: formatoCantidad(total, item.unidad) };
  });

  return CATEGORIAS
    .map((categoria) => ({
      ...categoria,
      items: lista.filter((item) => item.categoria === categoria.id).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    }))
    .filter((grupo) => grupo.items.length);
}
