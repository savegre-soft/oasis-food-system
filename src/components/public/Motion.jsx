// Componentes de animación reutilizables para el sitio público.
//
// Envuelven framer-motion con los tokens de src/lib/motion.js para que todas las
// páginas usen el mismo lenguaje de movimiento (aparición desde abajo, escalonado
// y micro-interacciones) sin repetir variantes en cada archivo.
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, viewportOnce } from '../../lib/motion';

// Revela un bloque (fundido + desplazamiento).
// `as` permite cambiar la etiqueta (p. ej. "section", "li", "ul").
// `inView` (por defecto true) usa scroll-reveal; con inView={false} anima al
// montar — necesario para contenido principal que se pagina o carga async
// (si no, el whileInView con once:true deja ocultas las tandas siguientes).
export const Reveal = ({
  as = 'div',
  variants = fadeUp,
  inView = true,
  className = '',
  children,
  ...rest
}) => {
  const Tag = motion[as] ?? motion.div;
  const trigger = inView
    ? { whileInView: 'show', viewport: viewportOnce }
    : { animate: 'show' };
  return (
    <Tag variants={variants} initial="hidden" {...trigger} className={className} {...rest}>
      {children}
    </Tag>
  );
};

// Contenedor que escalona la aparición de sus <StaggerItem> hijos.
export const Stagger = ({
  as = 'div',
  stagger = 0.08,
  delayChildren = 0,
  inView = true,
  className = '',
  children,
  ...rest
}) => {
  const Tag = motion[as] ?? motion.div;
  const trigger = inView
    ? { whileInView: 'show', viewport: viewportOnce }
    : { animate: 'show' };
  return (
    <Tag
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      {...trigger}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// Hijo de <Stagger>: hereda el disparo del contenedor, solo aporta la variante.
export const StaggerItem = ({ as = 'div', variants = fadeUp, className = '', children, ...rest }) => {
  const Tag = motion[as] ?? motion.div;
  return (
    <Tag variants={variants} className={className} {...rest}>
      {children}
    </Tag>
  );
};
