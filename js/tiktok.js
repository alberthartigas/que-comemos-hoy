// Enlaces de TikTok: se normalizan al guardar y los videos se reproducen dentro de la app
// (reproductor oficial para desarrolladores: https://www.tiktok.com/player/v1/<id>, sin pie ni recomendaciones).

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

/** Número de video a partir de un enlace largo (los cortos vm.tiktok.com los resuelve el servidor). */
export const idVideoTikTok = (url) => /\/video\/(\d+)/.exec(String(url ?? ''))?.[1] ?? null;

/** Reproductor oficial de TikTok para un video: solo el video con controles, sin salir de la app. */
export const urlReproductorTikTok = (id) => `https://www.tiktok.com/player/v1/${id}?controls=1&rel=0&description=0&music_info=0&native_context_menu=0&closed_caption=0`;
