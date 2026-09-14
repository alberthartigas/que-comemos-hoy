// Modo claro/oscuro. De fábrica es "claro"; "oscuro" y "auto" (sigue al sistema) son elección de la persona.
// Se guarda aparte del resto de los datos: es una preferencia de este dispositivo.

const CLAVE = 'que-comemos-hoy:tema';
const COLOR_BARRA = { claro: '#fff7ef', oscuro: '#14100d' };

export const TEMAS = [
  { id: 'claro', nombre: 'Claro' },
  { id: 'oscuro', nombre: 'Oscuro' },
  { id: 'auto', nombre: 'Automático', descripcion: 'Sigue al sistema del celular' },
];
const TEMA_DEFECTO = 'claro';

const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)');
const oyentes = new Set();

export function temaGuardado() {
  try {
    const tema = localStorage.getItem(CLAVE);
    return TEMAS.some((t) => t.id === tema) ? tema : TEMA_DEFECTO;
  } catch {
    return TEMA_DEFECTO;
  }
}

/** Lo que se ve en pantalla: "claro" u "oscuro". */
export function temaEfectivo(tema = temaGuardado()) {
  if (tema !== 'auto') return tema;
  return sistemaOscuro.matches ? 'oscuro' : 'claro';
}

export function aplicarTema(tema = temaGuardado()) {
  const raiz = document.documentElement;
  if (tema === 'auto') delete raiz.dataset.tema;
  else raiz.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = COLOR_BARRA[temaEfectivo(tema)];
  oyentes.forEach((oyente) => oyente(tema));
}

export function guardarTema(tema) {
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // sin almacenamiento: solo aplica para esta visita
  }
  aplicarTema(tema);
}

/** El botón de arriba: cambia entre claro y oscuro a partir de lo que se ve ahora. */
export function alternarTema() {
  guardarTema(temaEfectivo() === 'oscuro' ? 'claro' : 'oscuro');
}

export function alCambiarTema(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

// Si el sistema cambia de modo y estamos en "auto", avisa para refrescar el ícono y la barra.
sistemaOscuro.addEventListener('change', () => {
  if (temaGuardado() === 'auto') aplicarTema('auto');
});
