// Familia, horarios, cómo abrirla en el celular y respaldo de datos.

import { claveFecha } from '../fechas.js';
import { HORARIOS_DEFECTO, INFO_TIPO, TIPOS } from '../horarios.js';
import { ICONOS } from '../iconos.js';
import { porcionesTotales } from '../porciones.js';
import {
  actualizarAjustes, borrarTodo, exportarDatos, importarDatos, restaurarRecetasBase, volverASortearSemana,
} from '../store.js';
import { descargarArchivo, esc, textoPersonas, toast } from '../util.js';
import { stepperPersonas } from './comun.js';

const PORCION_ADULTO = [[0.8, 'Ligera (80%)'], [1, 'Normal (100%)'], [1.25, 'Abundante (125%)'], [1.5, 'Muy abundante (150%)']];
const PORCION_NINO = [[0.4, '40% · 2 a 4 años'], [0.5, '50% · 4 a 6 años'], [0.6, '60% · 6 a 9 años'], [0.75, '75% · 9 a 12 años'], [1, '100% · adolescentes']];

const esEstaComputadora = () => ['localhost', '127.0.0.1'].includes(location.hostname);
let red = { estado: 'sin-consultar', urls: [] };

function opciones(lista, actual) {
  const valores = lista.some(([valor]) => valor === actual) ? lista : [...lista, [actual, `${Math.round(actual * 100)}%`]];
  return valores.map(([valor, texto]) => `<option value="${valor}"${valor === actual ? ' selected' : ''}>${texto}</option>`).join('');
}

function seccionCelular() {
  if (!esEstaComputadora()) {
    return `<p>Ya la estás usando desde <strong>${esc(location.host)}</strong>.</p>`;
  }
  if (red.estado === 'listo' && red.urls.length) {
    return `<p>Con el celular en el mismo Wi-Fi, abre en su navegador:</p>${red.urls.map((url) => `<p class="url-lan">${esc(url)}</p>`).join('')}`;
  }
  if (red.estado === 'listo' || red.estado === 'error') {
    return '<p class="nota">No encontré tu red. Revisa en la terminal la dirección que dice "En tu celular".</p>';
  }
  return '<p class="nota">Buscando la dirección en tu red…</p>';
}

export function alMontar(_raiz, ctx) {
  if (red.estado !== 'sin-consultar' || !esEstaComputadora()) return;
  red = { estado: 'consultando', urls: [] };
  fetch('/api/red')
    .then((respuesta) => respuesta.json())
    .then(({ urls }) => { red = { estado: 'listo', urls }; })
    .catch(() => { red = { estado: 'error', urls: [] }; })
    .finally(() => { if (ctx.nombre === 'ajustes' && location.hash.startsWith('#/ajustes')) ctx.repintar(); });
}

export function render({ estado }) {
  const { ajustes } = estado;
  return `
    <header class="encabezado"><h1>Ajustes</h1></header>

    <section class="tarjeta">
      <h2>👨‍👩‍👧 ¿Cuántos comen en casa?</h2>
      <div class="personas">
        ${stepperPersonas('adultos', 'Adultos', ajustes.adultos, ajustes.ninos ? 0 : 1)}
        ${stepperPersonas('ninos', 'Niños', ajustes.ninos, ajustes.adultos ? 0 : 1)}
      </div>
      <label class="campo">
        <span class="campo__titulo">Porción de cada adulto</span>
        <select class="entrada" data-cambio="factorAdulto">${opciones(PORCION_ADULTO, ajustes.factorAdulto)}</select>
      </label>
      <label class="campo">
        <span class="campo__titulo">Porción de cada niño</span>
        <select class="entrada" data-cambio="factorNino">${opciones(PORCION_NINO, ajustes.factorNino)}</select>
      </label>
      <p class="tip">Para ${textoPersonas(ajustes)}, cada receta se calcula como <strong>${porcionesTotales(ajustes)} porciones</strong> de adulto.</p>
    </section>

    <section class="tarjeta">
      <h2>⏰ Horarios de comida</h2>
      <p class="nota">La pantalla de inicio usa estas horas para saber si toca desayuno, comida o cena.</p>
      ${TIPOS.map((tipo) => `<div class="horario">
        <span class="horario__titulo">${INFO_TIPO[tipo].emoji} ${INFO_TIPO[tipo].nombre}</span>
        <input class="entrada" type="time" value="${ajustes.horarios[tipo].inicio}" data-cambio="horario" data-tipo="${tipo}" data-extremo="inicio" aria-label="${INFO_TIPO[tipo].nombre} desde">
        <span class="horario__a">a</span>
        <input class="entrada" type="time" value="${ajustes.horarios[tipo].fin}" data-cambio="horario" data-tipo="${tipo}" data-extremo="fin" aria-label="${INFO_TIPO[tipo].nombre} hasta">
      </div>`).join('')}
      <button class="btn btn--texto" type="button" data-accion="horarios-defecto">Restablecer horarios</button>
    </section>

    <section class="tarjeta">
      <h2>📱 Ábrela en tu celular</h2>
      ${seccionCelular()}
      <p class="nota"><strong>iPhone:</strong> en Safari toca Compartir → "Agregar a inicio".<br><strong>Android:</strong> en Chrome toca ⋮ → "Agregar a la pantalla principal".</p>
      <p class="nota">Cada celular guarda sus propias recetas y plan. Para pasarlos de uno a otro usa el respaldo.</p>
    </section>

    <section class="tarjeta">
      <h2>💾 Tus datos</h2>
      <p class="nota">Todo se guarda solo en este dispositivo, sin cuentas.</p>
      <button class="btn btn--bloque" type="button" data-accion="exportar">Descargar respaldo</button>
      <label class="btn btn--bloque">Importar respaldo<input type="file" accept="application/json,.json" data-cambio="importar" hidden></label>
      <button class="btn btn--bloque" type="button" data-accion="resortear">${ICONOS.aleatorio} Volver a sortear esta semana</button>
      <button class="btn btn--bloque" type="button" data-accion="restaurar">Restaurar recetas de ejemplo</button>
      <button class="btn btn--peligro btn--bloque" type="button" data-accion="borrar">Borrar todo y empezar de cero</button>
    </section>

    <p class="pie">¿Qué comemos hoy? · versión de prueba 0.1</p>`;
}

function cambiarPersonas(campo, cambio, { estado }) {
  const { ajustes } = estado;
  const valor = Math.min(20, Math.max(0, ajustes[campo] + cambio));
  const otro = campo === 'adultos' ? ajustes.ninos : ajustes.adultos;
  if (valor + otro > 0) actualizarAjustes({ [campo]: valor });
}

export const acciones = {
  mas: (boton, ctx) => cambiarPersonas(boton.dataset.campo, 1, ctx),
  menos: (boton, ctx) => cambiarPersonas(boton.dataset.campo, -1, ctx),
  'horarios-defecto'() {
    actualizarAjustes({ horarios: HORARIOS_DEFECTO });
    toast('Horarios restablecidos');
  },
  exportar() {
    descargarArchivo(`respaldo-que-comemos-${claveFecha()}.json`, exportarDatos());
  },
  resortear() {
    if (!confirm('¿Volver a sortear las comidas de hoy al domingo?')) return;
    volverASortearSemana(claveFecha());
    toast('Semana sorteada de nuevo 🎲');
  },
  restaurar() {
    restaurarRecetasBase();
    toast('Recetas de ejemplo restauradas');
  },
  borrar() {
    if (!confirm('¿Borrar recetas propias, plan y ajustes de este dispositivo? No se puede deshacer.')) return;
    borrarTodo();
    toast('Listo, empezamos de cero');
  },
};

export const cambios = {
  factorAdulto: (select) => actualizarAjustes({ factorAdulto: Number(select.value) }),
  factorNino: (select) => actualizarAjustes({ factorNino: Number(select.value) }),
  horario(campo, { estado }) {
    const valor = campo.value.slice(0, 5);
    if (!valor) return;
    const { tipo, extremo } = campo.dataset;
    const { horarios } = estado.ajustes;
    actualizarAjustes({ horarios: { ...horarios, [tipo]: { ...horarios[tipo], [extremo]: valor } } });
    toast('Horario guardado');
  },
  importar(campo) {
    const archivo = campo.files?.[0];
    if (!archivo) return;
    if (!confirm('Importar reemplaza tus recetas, plan y ajustes actuales. ¿Continuar?')) {
      campo.value = '';
      return;
    }
    archivo.text()
      .then((texto) => {
        importarDatos(texto);
        toast('Respaldo importado ✅');
      })
      .catch((error) => toast(error instanceof SyntaxError ? 'El archivo no es un respaldo válido.' : error.message));
  },
};
