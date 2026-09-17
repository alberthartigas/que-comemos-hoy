// Hoja inferior (diálogo que sube desde abajo) compartida por "Agregar al calendario",
// "Compras del día", "Agregar mi receta", "Elegir receta" y "Video". Vive fuera de #vista, así que
// cada hoja pone sus propios manejadores (onsubmit/onchange/onclick/oninput) después de abrirla.
// Entra con un resorte suave y sale bajando despacio; cerrar siempre pasa por hoja.close().

let hoja = null;
const DURACION_SALIDA_MS = 520;

const sinAnimaciones = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function crear() {
  hoja = document.createElement('dialog');
  hoja.id = 'hoja';
  hoja.className = 'hoja';
  document.body.append(hoja);

  hoja.addEventListener('click', (evento) => {
    if (evento.target === hoja) hoja.close(); // toque fuera de la hoja
  });
  // Escape: en vez del cierre instantáneo del navegador, la salida animada
  hoja.addEventListener('cancel', (evento) => {
    evento.preventDefault();
    hoja.close();
  });
  // Los formularios (method="dialog") no cierran solos: cada hoja decide cuándo cerrar
  hoja.addEventListener('submit', (evento) => evento.preventDefault(), true);
  hoja.addEventListener('animationend', (evento) => {
    if (evento.target.classList?.contains('hoja__contenido')) hoja.classList.remove('hoja--entrando');
  });

  const cerrarNativo = hoja.close.bind(hoja);
  let cerrando = false;
  hoja.close = () => {
    if (!hoja.open || cerrando) return;
    cerrando = true;
    hoja.classList.remove('hoja--entrando');
    let terminado = false;
    const fin = () => {
      if (terminado) return;
      terminado = true;
      cerrando = false;
      hoja.classList.remove('hoja--saliendo');
      cerrarNativo();
    };
    const contenido = hoja.querySelector('.hoja__contenido');
    if (!contenido || sinAnimaciones()) return fin();
    hoja.classList.add('hoja--saliendo');
    contenido.addEventListener('animationend', fin, { once: true });
    setTimeout(fin, DURACION_SALIDA_MS); // por si la animación no dispara
  };
}

export function abrirHoja(html) {
  if (!hoja) crear();
  hoja.onsubmit = null;
  hoja.onchange = null;
  hoja.onclick = null;
  hoja.oninput = null;
  hoja.innerHTML = html;
  for (const boton of hoja.querySelectorAll('[data-cerrar]')) boton.addEventListener('click', () => hoja.close());
  if (!hoja.open) {
    hoja.classList.remove('hoja--saliendo');
    hoja.classList.add('hoja--entrando');
    hoja.showModal();
  }
  return hoja;
}

export function cerrarHoja() {
  if (hoja?.open) hoja.close();
}
