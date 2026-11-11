import { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- usado como <motion.div> abajo; no-unused-vars no reconoce el uso vía member expression
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import {
  COOKIE_PREFS_OPEN_EVENT,
  getCookieConsent,
  setCookieConsent,
} from '../../lib/cookieConsent';

// Banner de cookies del sitio público — aparece en la primera visita (sin
// preferencia guardada) y se puede reabrir desde "Preferencias de cookies"
// en el pie de página. Aceptar/Rechazar quedan al mismo nivel visual (sin
// pre-marcar ninguno) para no inducir el consentimiento, como exige la
// lectura estándar de consentimiento informado de la Ley N.º 8968.
const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!getCookieConsent()) setVisible(true);
    }, 0);

    const openFromFooter = () => {
      setExpanded(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_PREFS_OPEN_EVENT, openFromFooter);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(COOKIE_PREFS_OPEN_EVENT, openFromFooter);
    };
  }, []);

  const decide = (analytics) => {
    setCookieConsent(analytics);
    setVisible(false);
    setExpanded(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
          role="dialog"
          aria-label="Preferencias de cookies"
        >
          <div className="max-w-3xl mx-auto bg-oasis-ink text-oasis-cream rounded-2xl shadow-2xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Cookie size={22} className="shrink-0 mt-0.5 text-oasis-cream/80" />
              <div className="text-sm text-oasis-cream/90 leading-relaxed">
                <p>
                  Usamos cookies y almacenamiento local propios para que el sitio funcione (como
                  recordar tu sesión o tu tema de color). Si aceptás, también nos ayudás a medir
                  el uso del sitio para mejorarlo. Podés aceptar, rechazar lo no esencial, o leer
                  el detalle completo en nuestra{' '}
                  <Link
                    to="/politica-privacidad#cookies"
                    className="underline font-medium hover:text-white"
                    onClick={() => setVisible(false)}
                  >
                    política de privacidad
                  </Link>
                  .
                </p>
                {expanded && (
                  <p className="mt-2 text-oasis-cream/70">
                    Hoy este sitio no usa ninguna cookie de analítica o publicidad de terceros —
                    solo almacenamiento técnico necesario. Tu elección queda guardada igual, para
                    el día que eso cambie.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 justify-end">
              <button
                type="button"
                onClick={() => decide(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-oasis-cream/30 text-oasis-cream hover:bg-white/10 transition"
              >
                Rechazar no esenciales
              </button>
              <button
                type="button"
                onClick={() => decide(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-oasis-olive-600 text-white hover:bg-oasis-olive-700 transition"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
