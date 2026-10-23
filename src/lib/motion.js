// Tokens y variantes de animación compartidas para el sitio público.
//
// framer-motion respeta prefers-reduced-motion gracias a
// <MotionConfig reducedMotion="user"> en PublicLayout: con eso las animaciones
// de transform (y/scale) se neutralizan solas para quien pide menos movimiento,
// conservando solo el fundido de opacidad. Por eso acá no repetimos media
// queries: definimos los tokens una sola vez y los reutilizamos en todo el sitio.

// Curva suave tipo easeOutExpo: entra con energía y asienta despacio.
export const EASE = [0.22, 1, 0.36, 1];

export const DURATION = {
  fast: 0.35,
  base: 0.55,
  slow: 0.7,
};

// Aparición desde abajo — el gesto por defecto para secciones y tarjetas.
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
};

// Solo fundido, sin desplazamiento — para fondos, imágenes y bloques grandes.
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE } },
};

// Entra escalando levemente — ideal para la imagen del hero y los modales.
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE } },
};

// Contenedor que escalona la aparición de sus hijos (usar con <Stagger>).
export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

// Config de viewport común: dispara una sola vez, un poco antes de entrar.
export const viewportOnce = { once: true, margin: '-60px' };
