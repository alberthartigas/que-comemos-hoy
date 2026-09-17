// Hoja inferior (diálogo que sube desde abajo) compartida por "Agregar al calendario",
// "Compras del día" y "Agregar mi receta". Vive fuera de #vista, así que cada hoja pone sus
// propios manejadores (onsubmit/onchange/onclick) después de abrirla.

let hoja = null;

export function abrirHoja(html) {
  if (!hoja) {
    hoja = document.createElement('dialog');
    hoja.id = 'hoja';
    hoja.className = 'hoja';
    document.body.append(hoja);
    hoja.addEventListener('click', (evento) => {
      if (evento.target === hoja) hoja.close(); // toque fuera de la hoja
    });
  }
  hoja.onsubmit = null;
  hoja.onchange = null;
  hoja.onclick = null;
  hoja.innerHTML = html;
  for (const boton of hoja.querySelectorAll('[data-cerrar]')) boton.addEventListener('click', () => hoja.close());
  if (!hoja.open) hoja.showModal();
  return hoja;
}

export function cerrarHoja() {
  if (hoja?.open) hoja.close();
}
