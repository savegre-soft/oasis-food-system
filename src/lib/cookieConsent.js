// Consentimiento de cookies del sitio público (RF legal — ver
// /politica-privacidad §12). Se guarda en localStorage, nunca en el
// servidor: es una preferencia del navegador, no un dato de un cliente real.
//
// Hoy el sitio no carga ningún script de analítica/publicidad — por eso
// "Rechazar" no deshabilita nada todavía. Esta utilidad existe para que,
// el día que se agregue una herramienta de analítica (Google Analytics,
// Meta Pixel, etc.), ese script se condicione a `hasAnalyticsConsent()` en
// vez de cargarse siempre — la decisión del visitante ya queda respetada
// desde ahora.
const STORAGE_KEY = 'oasis_cookie_consent';
export const COOKIE_PREFS_OPEN_EVENT = 'oasis:cookie-prefs:open';

export const getCookieConsent = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCookieConsent = (analytics) => {
  const value = { analytics, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* localStorage puede no estar disponible (ej. modo privado) — la
       preferencia simplemente no persiste entre sesiones en ese caso */
  }
  return value;
};

export const hasAnalyticsConsent = () => getCookieConsent()?.analytics === true;

// Reabre el banner desde cualquier parte del sitio (ej. el link
// "Preferencias de cookies" del pie de página) sin necesitar contexto/estado
// global — CookieConsentBanner.jsx escucha este evento.
export const openCookiePreferences = () => {
  window.dispatchEvent(new Event(COOKIE_PREFS_OPEN_EVENT));
};
