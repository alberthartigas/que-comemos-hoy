// Enlaces a TikTok: video específico (si la receta tiene uno) o búsqueda del platillo.

/** Acepta enlaces de tiktok.com (incluye vm.tiktok.com) aunque se peguen sin "https://". Si no es válido devuelve ''. */
export function normalizarUrlTikTok(texto) {
  const limpio = String(texto ?? '').trim();
  if (!limpio) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`);
    if (!/(^|\.)tiktok\.com$/i.test(url.hostname)) return '';
    url.protocol = 'https:';
    return url.toString();
  } catch {
    return '';
  }
}

export function busquedaTikTok(nombreReceta) {
  return `https://www.tiktok.com/search?q=${encodeURIComponent(`receta ${nombreReceta} fácil`)}`;
}
