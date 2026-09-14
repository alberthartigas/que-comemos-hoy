// Service worker: primero la red (así nunca ves una versión vieja mientras desarrollas)
// y, si no hay conexión, lo último que se guardó. Solo se activa en https o localhost.

const CACHE = 'que-comemos-hoy-v3';
const PORTADA = new URL('./', self.location).href;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((clave) => clave !== CACHE).map((clave) => caches.delete(clave))))
      .then(() => self.clients.claim()),
  );
});

async function sinConexion(request) {
  const guardada = await caches.match(request, { ignoreSearch: true });
  if (guardada) return guardada;
  // La portada se pide como "/carpeta/" o como "/carpeta/index.html": vale cualquiera de las dos.
  if (request.mode === 'navigate') {
    return (await caches.match(PORTADA)) ?? (await caches.match(`${PORTADA}index.html`)) ?? Response.error();
  }
  return Response.error();
}

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;

  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
        }
        return respuesta;
      })
      .catch(() => sinConexion(request)),
  );
});

// ---------- Notificaciones push (las manda ia/push.js del servidor) ----------

self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data?.json() ?? {};
  } catch {
    datos = { cuerpo: evento.data?.text() ?? '' };
  }
  evento.waitUntil(self.registration.showNotification(datos.titulo || '¿Qué comemos hoy?', {
    body: datos.cuerpo || '',
    icon: new URL('./icons/icon-192.png', self.location).href,
    badge: new URL('./icons/logo-blanco.png', self.location).href,
    tag: datos.etiqueta || 'aviso',
    data: { url: datos.url || `${PORTADA}#/hoy` },
  }));
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const url = evento.notification.data?.url || `${PORTADA}#/hoy`;
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (ventanas) => {
      const abierta = ventanas.find((v) => v.url.startsWith(PORTADA));
      if (abierta) {
        if ('navigate' in abierta) await abierta.navigate(url).catch(() => {});
        return abierta.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
