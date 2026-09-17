import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RECETAS_BASE } from '../data/recetas-base.js';
import { diasDeSemana, diasEntre, inicioSemana, sumarDias } from '../js/fechas.js';
import { TIPOS, tipoSegunHora } from '../js/horarios.js';
import { cambiarReceta, completarDia, completarSemana, fijarReceta, recortarHistorial } from '../js/planner.js';
import {
  UNIDADES, categorizar, escalarIngredientes, formatoCantidad, listaDeCompras, porcionesTotales, redondear,
} from '../js/porciones.js';
import { busquedaTikTok, normalizarUrlTikTok } from '../js/tiktok.js';

/** Generador pseudoaleatorio con semilla (mulberry32) para pruebas repetibles. */
function azarConSemilla(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const alas = (h, m, dia = 13) => new Date(2026, 8, dia, h, m); // septiembre de 2026; el 13 es domingo

test('semanas de lunes a domingo', () => {
  assert.equal(inicioSemana('2026-09-13'), '2026-09-07');
  assert.equal(inicioSemana('2026-09-07'), '2026-09-07');
  assert.equal(sumarDias('2026-09-30', 1), '2026-10-01');
  assert.equal(diasEntre('2026-09-07', '2026-09-13'), 6);
  assert.equal(diasDeSemana('2026-09-10').at(-1), '2026-09-13');
});

test('regla de horario: desayuno, comida o cena', () => {
  assert.deepEqual(tipoSegunHora(alas(8, 0), {}), { tipo: 'desayuno', fecha: '2026-09-13', estado: 'ahora' });
  assert.equal(tipoSegunHora(alas(12, 0), {}).tipo, 'comida');
  assert.equal(tipoSegunHora(alas(17, 59), {}).tipo, 'comida');
  assert.equal(tipoSegunHora(alas(19, 30), {}).tipo, 'cena');

  const noche = tipoSegunHora(alas(23, 30), {});
  assert.deepEqual([noche.tipo, noche.estado, noche.fecha], ['desayuno', 'siguiente', '2026-09-14']);
  const madrugada = tipoSegunHora(alas(3, 0), {});
  assert.deepEqual([madrugada.tipo, madrugada.fecha], ['desayuno', '2026-09-13']);

  const cenaTarde = { cena: { inicio: '20:00', fin: '01:00' } };
  assert.deepEqual(tipoSegunHora(alas(0, 30), cenaTarde), { tipo: 'cena', fecha: '2026-09-12', estado: 'ahora' });
});

test('porciones: los niños comen menos que los adultos', () => {
  assert.equal(porcionesTotales({ adultos: 2, ninos: 2, factorNino: 0.6 }), 3.2);
  assert.equal(porcionesTotales({ adultos: 0, ninos: 0 }), 1);
  assert.equal(redondear(2 * 3.2, 'pza', 1), 7);
  assert.equal(redondear(0.6 * 5, 'pza', 1), 3);
  assert.equal(redondear(150 * 3.2, 'g'), 480);
  assert.equal(formatoCantidad(1.5, 'taza'), '1 ½ tazas');
  assert.equal(formatoCantidad(0.5, 'pza'), '½ pza');
  assert.equal(formatoCantidad(1250, 'g'), '1.25 kg');
  assert.equal(formatoCantidad(0, 'gusto'), 'al gusto');
  const [huevo, pollo] = escalarIngredientes(
    [{ nombre: 'Huevo', cantidad: 2, unidad: 'pza', paso: 1 }, { nombre: 'Pollo', cantidad: 0.25, unidad: 'kg' }], 1.6);
  assert.equal(huevo.texto, '4 pzas');
  assert.equal(pollo.texto, '400 g');
});

test('categorías de la lista de compras', () => {
  const casos = {
    'Atún en agua': 'abarrotes', 'Crema de cacahuate': 'abarrotes', 'Salsa verde': 'abarrotes', Sal: 'despensa',
    'Aceite de oliva': 'despensa', 'Chile en polvo': 'despensa', 'Pechuga de pollo': 'carnes', 'Queso panela': 'lacteos',
    'Jamón de pavo': 'lacteos', 'Yogur natural': 'lacteos', 'Tortilla de maíz': 'tortilleria', 'Chile serrano': 'verduras',
    Champiñones: 'verduras', Ajo: 'verduras', 'Algo raro': 'otros',
  };
  for (const [nombre, categoria] of Object.entries(casos)) assert.equal(categorizar(nombre), categoria, nombre);
});

test('la lista de compras suma antes de redondear', () => {
  const receta = (nombre) => ({ nombre, ingredientes: [{ nombre: 'Cebolla', cantidad: 0.25, unidad: 'pza' }] });
  const grupos = listaDeCompras([{ receta: receta('A'), porciones: 1 }, { receta: receta('B'), porciones: 1 }]);
  const cebolla = grupos.flatMap((g) => g.items).find((item) => item.nombre === 'Cebolla');
  assert.equal(cebolla.texto, '½ pza');
  assert.deepEqual(cebolla.recetas, ['A', 'B']);
});

test('enlaces de TikTok', () => {
  assert.equal(normalizarUrlTikTok('vm.tiktok.com/ZMabc/'), 'https://vm.tiktok.com/ZMabc/');
  assert.equal(normalizarUrlTikTok('https://www.tiktok.com/@chef/video/123'), 'https://www.tiktok.com/@chef/video/123');
  assert.equal(normalizarUrlTikTok('https://tiktok.com.malicioso.com/x'), '');
  assert.equal(normalizarUrlTikTok('javascript:alert(1)'), '');
  assert.match(busquedaTikTok('Huevos a la mexicana'), /^https:\/\/www\.tiktok\.com\/search\?q=receta%20Huevos/);
});

test('recetas base completas y bien formadas', () => {
  const ids = new Set();
  const unidades = new Set(UNIDADES.map((u) => u.id));
  for (const r of RECETAS_BASE) {
    assert.ok(!ids.has(r.id), `id repetido: ${r.id}`);
    ids.add(r.id);
    assert.ok(r.tipos.length && r.tipos.every((t) => TIPOS.includes(t)), r.id);
    assert.ok(r.minutos > 0 && r.minutos <= 40, `${r.id} tarda demasiado`);
    assert.ok(r.pasos.length >= 3, `${r.id}: pocos pasos`);
    for (const ing of r.ingredientes) {
      assert.ok(unidades.has(ing.unidad), `${r.id}: unidad ${ing.unidad}`);
      assert.notEqual(categorizar(ing.nombre), 'otros', `${r.id}: "${ing.nombre}" sin pasillo`);
      if (ing.unidad !== 'gusto') assert.ok(ing.cantidad > 0, `${r.id}: cantidad de ${ing.nombre}`);
    }
  }
  for (const tipo of TIPOS) assert.ok(RECETAS_BASE.filter((r) => r.tipos.includes(tipo)).length >= 10, tipo);
});

test('una semana entera sin repetir en el día ni en la semana', () => {
  for (let semilla = 1; semilla <= 200; semilla++) {
    const plan = completarSemana({ recetas: RECETAS_BASE, plan: {}, fecha: '2026-09-07', rng: azarConSemilla(semilla) });
    const ids = Object.values(plan).flatMap((dia) => TIPOS.map((tipo) => dia[tipo]));
    assert.equal(ids.length, 21);
    assert.equal(new Set(ids).size, 21, `semilla ${semilla}`);
    for (const dia of Object.values(plan)) {
      for (const tipo of TIPOS) assert.ok(RECETAS_BASE.find((r) => r.id === dia[tipo]).tipos.includes(tipo));
    }
  }
});

test('con pocas recetas repite entre días, pero nunca en el mismo día', () => {
  const recetas = [
    { id: 'a', nombre: 'A', tipos: ['desayuno', 'cena'], ingredientes: [] },
    { id: 'b', nombre: 'B', tipos: ['desayuno', 'cena'], ingredientes: [] },
  ];
  const plan = completarSemana({ recetas, plan: {}, fecha: '2026-09-07', rng: azarConSemilla(7) });
  assert.equal(Object.keys(plan).length, 7);
  for (const dia of Object.values(plan)) {
    assert.ok(dia.desayuno && dia.cena);
    assert.notEqual(dia.desayuno, dia.cena);
    assert.equal(dia.comida, undefined);
  }
});

test('completarDia conserva lo válido y reemplaza recetas borradas', () => {
  const azar = azarConSemilla(3);
  const plan = completarDia({ recetas: RECETAS_BASE, plan: {}, fecha: '2026-09-13', rng: azar });
  assert.equal(completarDia({ recetas: RECETAS_BASE, plan, fecha: '2026-09-13', rng: azar }), plan);

  const borrada = plan['2026-09-13'].comida;
  const nuevo = completarDia({ recetas: RECETAS_BASE.filter((r) => r.id !== borrada), plan, fecha: '2026-09-13', rng: azar });
  assert.ok(nuevo['2026-09-13'].comida);
  assert.notEqual(nuevo['2026-09-13'].comida, borrada);
  assert.equal(nuevo['2026-09-13'].desayuno, plan['2026-09-13'].desayuno);
});

test('"otra opción" siempre cambia y no choca con el resto del día', () => {
  const azar = azarConSemilla(11);
  let plan = completarSemana({ recetas: RECETAS_BASE, plan: {}, fecha: '2026-09-07', rng: azar });
  const vistas = [];
  for (let i = 0; i < 25; i++) {
    const antes = plan['2026-09-09'].cena;
    const resultado = cambiarReceta({ recetas: RECETAS_BASE, plan, fecha: '2026-09-09', tipo: 'cena', vistas, rng: azar });
    assert.ok(resultado.cambio);
    assert.notEqual(resultado.id, antes);
    const dia = resultado.plan['2026-09-09'];
    assert.ok(dia.cena !== dia.desayuno && dia.cena !== dia.comida);
    vistas.push(antes);
    plan = resultado.plan;
  }
});

test('no gasta recetas en días que ya pasaron', () => {
  const plan = completarSemana({ recetas: RECETAS_BASE, plan: {}, fecha: '2026-09-07', desde: '2026-09-10', rng: azarConSemilla(5) });
  assert.deepEqual(Object.keys(plan).sort(), ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13']);
});

test('elegir a mano libera el otro espacio del día y el historial se recorta', () => {
  const plan = { '2026-09-13': { desayuno: 'molletes', cena: 'tostadas-frijol' } };
  assert.deepEqual(fijarReceta({ plan, fecha: '2026-09-13', tipo: 'cena', id: 'molletes' })['2026-09-13'], { cena: 'molletes' });

  const historial = { '2026-01-05': {}, '2026-09-01': {}, '2026-09-13': {} };
  assert.deepEqual(Object.keys(recortarHistorial(historial, '2026-09-13', 8)), ['2026-09-01', '2026-09-13']);
});

test('recetas parecidas y afinidad con favoritas', async () => {
  const { afinidadConFavoritas, delEstiloDeFavoritas, recetasParecidas } = await import('../js/similares.js');
  const huevos = RECETAS_BASE.find((r) => r.id === 'huevos-mexicana');
  const parecidas = recetasParecidas(huevos, RECETAS_BASE);
  assert.ok(parecidas.length >= 1 && parecidas.length <= 4);
  assert.ok(!parecidas.some((r) => r.id === huevos.id), 'no debe incluirse a sí misma');
  assert.ok(parecidas.some((r) => r.id === 'huevo-nopales' || r.id === 'burrito-huevo'), 'comparte huevo y desayuno');

  assert.equal(afinidadConFavoritas(huevos, RECETAS_BASE), 0, 'sin favoritas no hay afinidad');
  const conFavorita = RECETAS_BASE.map((r) => (r.id === 'huevos-mexicana' ? { ...r, favorita: true } : r));
  const estilo = delEstiloDeFavoritas(conFavorita);
  assert.ok(estilo.length >= 1 && !estilo.some((r) => r.favorita));
  assert.ok(afinidadConFavoritas(conFavorita.find((r) => r.id === 'huevo-nopales'), conFavorita) > 0.5);
  assert.equal(afinidadConFavoritas(conFavorita.find((r) => r.id === 'huevos-mexicana'), conFavorita), 0, 'la favorita no se compara consigo misma');
});

test('IA: extraer JSON y sanear lo que devuelve el modelo', async () => {
  const { extraerJSON } = await import('../ia/ia.js');
  const { sanearReceta } = await import('../js/recetas.js');
  assert.deepEqual(extraerJSON('```json\n{"a": 1}\n```'), { a: 1 });
  assert.deepEqual(extraerJSON('Claro, aquí va: {"nombre": "Tacos {ricos}", "pasos": ["a}b"]} y ya.'), { nombre: 'Tacos {ricos}', pasos: ['a}b'] });
  assert.throws(() => extraerJSON('sin json'), /JSON/);
  const receta = sanearReceta({ id: 'x', nombre: ' Sopa ', emoji: '🍲', tipos: ['cena', 'postre'], minutos: '25',
    ingredientes: [{ nombre: 'Calabacita', cantidad: '1', unidad: 'pza' }, { nombre: 'Sal', cantidad: 0, unidad: 'gusto' }, { nombre: '', cantidad: 1, unidad: 'pza' }, { nombre: 'Rara', cantidad: 2, unidad: 'kgs' }],
    pasos: ['Pica.', '', 'Cuece.'], tiktok: 'javascript:alert(1)' });
  assert.equal(receta.nombre, 'Sopa');
  assert.deepEqual(receta.tipos, ['cena']);
  assert.equal(receta.minutos, 25);
  assert.equal(receta.ingredientes.length, 3);
  assert.equal(receta.ingredientes[2].unidad, 'pza');
  assert.deepEqual(receta.pasos, ['Pica.', 'Cuece.']);
  assert.equal(receta.tiktok, '');
});

test('push: hora local, avisos pendientes y saneado de suscripciones', async () => {
  const { avisosPendientes, horaLocal, mensajeAviso, sanearSuscripcion } = await import('../ia/push.js');
  const instante = new Date('2026-09-14T14:30:00Z'); // 07:30 en Hermosillo (UTC-7), 08:30 en CDMX (UTC-6)
  assert.deepEqual(horaLocal(instante, 'America/Hermosillo'), { fecha: '2026-09-14', hhmm: '07:30' });
  assert.equal(horaLocal(instante, 'America/Mexico_City').hhmm, '08:30');
  assert.equal(horaLocal(instante, 'Zona/Inexistente').hhmm, '08:30', 'zona rara cae a CDMX');

  const sub = { zona: 'America/Hermosillo', avisos: { desayuno: '07:30', comida: '12:30', cena: null }, enviados: {}, plan: { '2026-09-14': { desayuno: 'Molletes' } } };
  assert.deepEqual(avisosPendientes(sub, instante), [{ tipo: 'desayuno', fecha: '2026-09-14' }]);
  assert.deepEqual(avisosPendientes({ ...sub, enviados: { desayuno: '2026-09-14' } }, instante), [], 'no repite el mismo día');
  assert.deepEqual(avisosPendientes(sub, new Date('2026-09-14T14:31:00Z')), [], 'solo en el minuto exacto');
  assert.match(mensajeAviso(sub, 'desayuno', '2026-09-14').cuerpo, /^Molletes/);
  assert.match(mensajeAviso(sub, 'cena', '2026-09-14').cuerpo, /Abre la app/);

  const limpia = sanearSuscripcion({
    suscripcion: { endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'a', auth: 'b' } },
    avisos: { desayuno: '7:30', comida: '12:30' }, zona: 'America/Hermosillo',
    plan: { '2026-09-14': { comida: 'Tinga', postre: 'x' }, malo: {} },
  }, 'https://ejemplo/');
  assert.deepEqual(limpia.avisos, { desayuno: null, comida: '12:30', cena: null });
  assert.deepEqual(limpia.plan, { '2026-09-14': { comida: 'Tinga' } });
  assert.equal(sanearSuscripcion({ suscripcion: { endpoint: 'http://inseguro', keys: { p256dh: 'a', auth: 'b' } } }), null);
});

test('actualizaciones: código de versión a partir de la etiqueta de la release', async () => {
  const { codigoDeEtiqueta } = await import('../js/actualizaciones.js');
  assert.equal(codigoDeEtiqueta('v0.1.12'), 12);
  assert.equal(codigoDeEtiqueta('0.2.3'), 3);
  assert.equal(codigoDeEtiqueta('rara'), 0);
});

test('calendario: días para agregar y nombre corto', async () => {
  const { diasParaAgregar, nombreDiaCorto } = await import('../js/fechas.js');
  const { estaSemana, proximaSemana } = diasParaAgregar('2026-09-16'); // miércoles
  assert.deepEqual(estaSemana, ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20']);
  assert.deepEqual([proximaSemana[0], proximaSemana.at(-1), proximaSemana.length], ['2026-09-21', '2026-09-27', 7]);
  assert.deepEqual(diasParaAgregar('2026-09-13').estaSemana, ['2026-09-13'], 'el domingo solo queda el domingo');
  assert.match(nombreDiaCorto('2026-09-14'), /^Lun/);
});

test('una receta puesta a mano en otro momento del día se respeta', () => {
  const plan = fijarReceta({ plan: {}, fecha: '2026-09-27', tipo: 'cena', id: 'arroz-pollo' }); // arroz-pollo es solo "comida"
  const completo = completarDia({ recetas: RECETAS_BASE, plan, fecha: '2026-09-27', rng: azarConSemilla(2) });
  assert.equal(completo['2026-09-27'].cena, 'arroz-pollo');
  assert.ok(completo['2026-09-27'].desayuno && completo['2026-09-27'].comida);
  assert.notEqual(completo['2026-09-27'].comida, 'arroz-pollo', 'no se repite en el mismo día');
});
