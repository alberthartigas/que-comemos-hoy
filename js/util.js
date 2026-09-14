// Utilidades de interfaz.

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para insertarlo en HTML (nombres de recetas escritos por la persona, etc.). */
export const esc = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);

let temporizadorToast;
export function toast(mensaje) {
  const el = document.getElementById('toast');
  el.textContent = mensaje;
  el.classList.add('visible');
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => el.classList.remove('visible'), 2800);
}

export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export function textoPersonas({ adultos, ninos }) {
  const partes = [];
  if (adultos) partes.push(plural(adultos, 'adulto', 'adultos'));
  if (ninos) partes.push(plural(ninos, 'niño', 'niños'));
  return partes.join(' y ');
}

/** "@usuario" a partir de un enlace de video de TikTok. */
export function autorTikTok(url) {
  const coincidencia = /tiktok\.com\/(@[^/?#]+)/i.exec(url ?? '');
  return coincidencia ? coincidencia[1] : '';
}

/** Copia al portapapeles; en http (celular por Wi-Fi) no existe navigator.clipboard, así que usa el método clásico. */
export async function copiarTexto(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // sigue con el método clásico
    }
  }
  const area = document.createElement('textarea');
  area.value = texto;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.append(area);
  area.select();
  area.setSelectionRange(0, texto.length);
  let copiado = false;
  try {
    copiado = document.execCommand('copy');
  } catch {
    copiado = false;
  }
  area.remove();
  return copiado;
}

export function descargarArchivo(nombre, contenido, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
