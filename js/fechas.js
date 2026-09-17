// Fechas en hora LOCAL del celular (nunca UTC), con semanas de lunes a domingo.

export const LOCALE = 'es-MX';

export function claveFecha(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function desdeClave(clave) {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(clave, dias) {
  const f = desdeClave(clave);
  f.setDate(f.getDate() + dias);
  return claveFecha(f);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function inicioSemana(clave) {
  const f = desdeClave(clave);
  const desdeLunes = (f.getDay() + 6) % 7;
  f.setDate(f.getDate() - desdeLunes);
  return claveFecha(f);
}

export function diasDeSemana(clave) {
  const lunes = inicioSemana(clave);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/** Días de A a B (negativo si B es anterior). Redondea para tolerar cambios de horario de verano. */
export function diasEntre(claveA, claveB) {
  return Math.round((desdeClave(claveB) - desdeClave(claveA)) / 86400000);
}

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const fmtLargo = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
const fmtDiaSemana = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });
const fmtDiaMes = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const fmtDiaCorto = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });

/** "Domingo, 13 de septiembre" */
export const fechaLarga = (clave) => capitalizar(fmtLargo.format(desdeClave(clave)));

/** "Lunes" */
export const nombreDia = (clave) => capitalizar(fmtDiaSemana.format(desdeClave(clave)));

/** "Lun" */
export const nombreDiaCorto = (clave) => capitalizar(fmtDiaCorto.format(desdeClave(clave)).replace(/\.$/, ''));

/** "13 sept – 19 sept" */
export const rangoFechas = (desde, hasta) => `${fmtDiaMes.format(desdeClave(desde))} – ${fmtDiaMes.format(desdeClave(hasta))}`;

/** "7 sept – 13 sept" */
export function rangoSemana(clave) {
  const dias = diasDeSemana(clave);
  return rangoFechas(dias[0], dias[6]);
}

/** Días a los que se puede agregar una receta: lo que queda de esta semana y toda la próxima. */
export function diasParaAgregar(hoy) {
  return {
    estaSemana: diasDeSemana(hoy).filter((dia) => dia >= hoy),
    proximaSemana: diasDeSemana(sumarDias(inicioSemana(hoy), 7)),
  };
}
