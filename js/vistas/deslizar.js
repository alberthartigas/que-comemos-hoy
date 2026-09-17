// Deslizar una fila de comida hacia la izquierda la quita de ese día. Funciona con dedo y con mouse
// (eventos pointer). Se activa una sola vez sobre #vista y sirve para todas las pantallas.

import { INFO_TIPO } from '../horarios.js';
import { omitirComida } from '../store.js';
import { toast } from '../util.js';

const UMBRAL = 96; // px que hay que arrastrar para que se quite
const ARRANQUE = 10; // px antes de decidir que es un arrastre y no un toque

export function activarDeslizar(contenedor) {
  let activo = null;

  contenedor.addEventListener('pointerdown', (evento) => {
    const slot = evento.target.closest('.slot[data-omitible]');
    if (!slot || (evento.pointerType === 'mouse' && evento.button !== 0)) return;
    activo = { slot, id: evento.pointerId, x0: evento.clientX, y0: evento.clientY, dx: 0, moviendo: false };
  });

  contenedor.addEventListener('pointermove', (evento) => {
    if (!activo || evento.pointerId !== activo.id) return;
    const dx = evento.clientX - activo.x0;
    const dy = evento.clientY - activo.y0;
    if (!activo.moviendo) {
      if (Math.abs(dx) < ARRANQUE || Math.abs(dx) < Math.abs(dy)) return; // es scroll o un toque
      activo.moviendo = true;
      activo.slot.classList.add('slot--deslizando');
      try {
        activo.slot.setPointerCapture(activo.id);
      } catch {
        // sin captura también funciona
      }
    }
    activo.dx = Math.min(0, dx);
    activo.slot.style.transform = `translateX(${activo.dx}px)`;
    activo.slot.classList.toggle('slot--listo', activo.dx < -UMBRAL);
  });

  const terminar = (evento) => {
    if (!activo || evento.pointerId !== activo.id) return;
    const { slot, dx, moviendo } = activo;
    activo = null;
    if (!moviendo) return;
    slot.classList.remove('slot--deslizando');
    // Que el arrastre no cuente como toque en el enlace
    const bloquear = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    slot.addEventListener('click', bloquear, { capture: true });
    setTimeout(() => slot.removeEventListener('click', bloquear, { capture: true }), 400);

    if (dx < -UMBRAL) {
      slot.classList.add('slot--fuera');
      const { fecha, tipo } = slot.dataset;
      setTimeout(() => {
        omitirComida(fecha, tipo);
        toast(`${INFO_TIPO[tipo].nombre} quitado de ese día. Toca el espacio para volver a ponerlo.`);
      }, 180);
    } else {
      slot.style.transform = '';
      slot.classList.remove('slot--listo');
    }
  };
  contenedor.addEventListener('pointerup', terminar);
  contenedor.addEventListener('pointercancel', terminar);
}
