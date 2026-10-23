import { Outlet, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- motion se usa como <motion.main> abajo
import { MotionConfig, motion } from 'framer-motion';
import PublicNavBar from '../components/PublicNavBar';
import PublicFooter from '../components/public/PublicFooter';
import { EASE } from '../lib/motion';

export default function PublicLayout() {
  const location = useLocation();

  return (
    // reducedMotion="user" desactiva el movimiento de transform para quien lo
    // pide en el sistema, en todo el árbol de motion del sitio público.
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-oasis-cream text-oasis-ink">
        <PublicNavBar />

        {/* La key por ruta remonta el contenido en cada navegación y dispara
            una transición de entrada suave (fundido + leve desplazamiento). */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex-1 w-full"
        >
          <Outlet />
        </motion.main>

        <PublicFooter />
      </div>
    </MotionConfig>
  );
}
