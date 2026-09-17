// Hoja "🎥 Video": reproduce el TikTok de la receta dentro de la app (reproductor incrustado oficial)
// y permite buscar otros videos sin salir. Nada abre la app de TikTok ni el navegador.

import { buscarVideoTikTok, estadoIA, videoTikTok } from '../ia.js';
import { ICONOS } from '../iconos.js';
import { guardarReceta, obtenerEstado } from '../store.js';
import { idVideoTikTok, urlReproductorTikTok } from '../tiktok.js';
import { esc, toast } from '../util.js';
import { abrirHoja } from './hoja.js';

const reproductor = (id) => `<div class="video" data-video>
    <iframe src="${urlReproductorTikTok(id)}" title="Video de la receta" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <div class="video__cargando"><span class="girando"></span></div>
  </div>`;

function marco(receta, cuerpo, { conBuscar = true } = {}) {
  return `<form method="dialog" class="hoja__contenido hoja__contenido--video">
    <span class="hoja__asa"></span>
    <div class="hoja__cabecera">
      <h2>🎥 ${esc(receta.nombre)}</h2>
      <button class="btn btn--icono" type="button" data-cerrar aria-label="Cerrar">${ICONOS.cerrar}</button>
    </div>
    <div data-cuerpo>${cuerpo}</div>
    ${conBuscar ? `<button class="btn btn--bloque" type="button" data-buscar>${ICONOS.buscar} ${receta.tiktok ? 'Buscar otro video' : 'Buscar un video'}</button>` : ''}
  </form>`;
}

function activarReproductor(hoja) {
  const iframe = hoja.querySelector('[data-video] iframe');
  iframe?.addEventListener('load', () => iframe.closest('[data-video]').classList.add('video--listo'), { once: true });
}

/** Abre el video de la receta; con { buscar: true } arranca directo en la búsqueda. */
export async function abrirVideoReceta(recetaId, { buscar = false } = {}) {
  const receta = obtenerEstado().recetas.find((r) => r.id === recetaId);
  if (!receta) return;
  const hoja = abrirHoja(marco(receta, '<div class="hoja__estado"><span class="girando"></span> Cargando video…</div>'));
  const cuerpo = () => hoja.querySelector('[data-cuerpo]');
  hoja.onsubmit = (evento) => evento.preventDefault();

  const mostrarVideo = (id) => {
    cuerpo().innerHTML = reproductor(id);
    activarReproductor(hoja);
  };

  const buscarVideos = async () => {
    const boton = hoja.querySelector('[data-buscar]');
    if (boton) boton.disabled = true;
    cuerpo().innerHTML = `<div class="hoja__estado"><span class="girando"></span> Buscando videos de «${esc(receta.nombre)}»…</div>`;
    try {
      const estado = await estadoIA();
      if (!estado.disponible) throw new Error('La búsqueda necesita el servidor con internet.');
      const { videos = [], motivo } = await buscarVideoTikTok(receta.nombre);
      if (!videos.length) {
        cuerpo().innerHTML = `<p class="aviso">No encontré videos verificados. ${esc(motivo || '')} Puedes pegar un enlace de TikTok al editar la receta y se reproducirá aquí.</p>`;
        return;
      }
      cuerpo().innerHTML = `<p class="nota">Toca uno para verlo aquí mismo:</p>
        <ul class="lista-recetas lista-recetas--mini">${videos.map((v, i) => `<li><button class="receta-item receta-item--boton" type="button" data-ver="${i}">
          <span class="emoji-caja">🎬</span>
          <span class="receta-item__texto"><strong>${esc(v.titulo || 'Video de TikTok')}</strong><small>${esc(v.autor ? `@${v.autor}` : '')}</small></span>
        </button></li>`).join('')}</ul>`;
      hoja.onclick = (evento) => {
        const elegido = evento.target.closest('[data-ver]');
        if (elegido) {
          const video = videos[Number(elegido.dataset.ver)];
          cuerpo().innerHTML = `${reproductor(video.id)}<button class="btn btn--primario btn--bloque" type="button" data-usar>Guardar este video en la receta</button>`;
          activarReproductor(hoja);
          hoja.onclick = (ev) => {
            if (ev.target.closest('[data-usar]')) {
              guardarReceta({ ...receta, tiktok: video.url });
              toast('Video guardado en la receta ✅');
              hoja.close();
            } else if (ev.target.closest('[data-buscar]')) buscarVideos();
          };
        } else if (evento.target.closest('[data-buscar]')) buscarVideos();
      };
    } catch (error) {
      cuerpo().innerHTML = `<p class="aviso">${esc(error.message)}</p>`;
    } finally {
      if (boton) boton.disabled = false;
    }
  };
  hoja.onclick = (evento) => {
    if (evento.target.closest('[data-buscar]')) buscarVideos();
  };

  if (buscar || !receta.tiktok) {
    if (receta.tiktok) mostrarVideo(idVideoTikTok(receta.tiktok));
    else cuerpo().innerHTML = '<p class="nota">Esta receta todavía no tiene video.</p>';
    if (buscar) buscarVideos();
    return;
  }
  let id = idVideoTikTok(receta.tiktok);
  if (!id) {
    try {
      id = (await videoTikTok(receta.tiktok)).id;
    } catch {
      id = null;
    }
  }
  if (!hoja.open) return;
  if (id) mostrarVideo(id);
  else cuerpo().innerHTML = '<p class="aviso">No pude cargar este video (quizá ya no existe). Busca otro abajo.</p>';
}
