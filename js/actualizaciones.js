// Actualizaciones de la APK. El envoltorio Android abre la web con ?apk=N (su versionCode). Aquí se
// guarda ese número y, una vez cada 6 horas, se consulta la última release de GitHub; si es más
// nueva, la pantalla de inicio muestra el aviso para descargar e instalar la APK encima (Android
// conserva los datos porque la firma es la misma).

const REPO = 'alberthartigas/que-comemos-hoy';
const API_ULTIMA = `https://api.github.com/repos/${REPO}/releases/latest`;
const APK_RESPALDO = new URL('que-comemos-hoy.apk', document.baseURI).href;
const VERSION_RESPALDO = new URL('version.json', document.baseURI).href;
const CLAVE_APK = 'que-comemos-hoy:apk';
const CLAVE_ULTIMA = 'que-comemos-hoy:ultima-release';
const CLAVE_POSPUESTA = 'que-comemos-hoy:actualizacion-pospuesta';
const CADA_MS = 6 * 60 * 60 * 1000;
const POSPONER_MS = 24 * 60 * 60 * 1000;

const leer = (clave) => {
  try {
    return JSON.parse(localStorage.getItem(clave));
  } catch {
    return null;
  }
};
const guardar = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // sin almacenamiento
  }
};

/** "v0.1.12" → 12 (el versionCode es el número de corrida de GitHub Actions). */
export function codigoDeEtiqueta(etiqueta) {
  const m = /^v?\d+\.\d+\.(\d+)$/.exec(String(etiqueta ?? '').trim());
  return m ? Number(m[1]) : 0;
}

/** Al arrancar: si la URL trae ?apk=N (viene del envoltorio Android), recuérdalo para esta sesión y este dispositivo. */
export function registrarVersionInstalada() {
  const apk = Number(new URL(location.href).searchParams.get('apk'));
  if (apk > 0) {
    guardar(CLAVE_APK, apk);
    try {
      sessionStorage.setItem(CLAVE_APK, String(apk));
    } catch {
      // sin sessionStorage
    }
  }
}

/** Versión de la APK con la que se abrió esta sesión (0 si es el navegador normal). */
export function versionInstalada() {
  try {
    return Number(sessionStorage.getItem(CLAVE_APK)) || 0;
  } catch {
    return 0;
  }
}

export const enApk = () => versionInstalada() > 0;

async function consultarGitHub() {
  const respuesta = await fetch(API_ULTIMA, { headers: { Accept: 'application/vnd.github+json' } });
  if (!respuesta.ok) throw new Error(`GitHub ${respuesta.status}`);
  const datos = await respuesta.json();
  const apk = (datos.assets ?? []).find((a) => a.name?.endsWith('.apk'));
  return { codigo: codigoDeEtiqueta(datos.tag_name), version: String(datos.tag_name ?? '').replace(/^v/, ''), url: apk?.browser_download_url ?? APK_RESPALDO, notas: String(datos.body ?? '').slice(0, 400) };
}

async function consultarRespaldo() {
  const respuesta = await fetch(VERSION_RESPALDO, { cache: 'no-store' });
  if (!respuesta.ok) throw new Error(`version.json ${respuesta.status}`);
  const datos = await respuesta.json();
  return { codigo: Number(datos.versionCode) || 0, version: String(datos.versionName ?? ''), url: datos.url || APK_RESPALDO, notas: '' };
}

/** Última release conocida (usa caché de 6 h salvo que se fuerce). Devuelve null si no se pudo consultar. */
export async function ultimaRelease({ forzar = false } = {}) {
  const guardada = leer(CLAVE_ULTIMA);
  if (!forzar && guardada && Date.now() - guardada.consultada < CADA_MS) return guardada;
  let release = null;
  try {
    release = await consultarGitHub();
  } catch {
    try {
      release = await consultarRespaldo();
    } catch {
      release = null;
    }
  }
  if (!release?.codigo) return guardada ?? null;
  const resultado = { ...release, consultada: Date.now() };
  guardar(CLAVE_ULTIMA, resultado);
  return resultado;
}

/** Release más nueva que la APK instalada, o null. `respetarPospuesta`: no molestar 24 h tras "Ahora no". */
export async function actualizacionDisponible({ forzar = false, respetarPospuesta = true } = {}) {
  const instalada = versionInstalada();
  if (!instalada) return null;
  const release = await ultimaRelease({ forzar });
  if (!release || release.codigo <= instalada) return null;
  const pospuesta = leer(CLAVE_POSPUESTA);
  if (respetarPospuesta && pospuesta?.codigo === release.codigo && Date.now() - pospuesta.cuando < POSPONER_MS) return null;
  return release;
}

export function posponerActualizacion(codigo) {
  guardar(CLAVE_POSPUESTA, { codigo, cuando: Date.now() });
}
