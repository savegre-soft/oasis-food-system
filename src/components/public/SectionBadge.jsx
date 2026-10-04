// Etiqueta pequeña en mayúsculas usada como "eyebrow" sobre los títulos de
// sección (p.ej. "ENTREGAS", "CÓMO FUNCIONA") a lo largo del sitio público.
const SectionBadge = ({ children, className = '' }) => (
  <span
    className={`inline-block text-xs font-semibold tracking-[0.2em] uppercase text-oasis-olive-600 ${className}`}
  >
    {children}
  </span>
);

export default SectionBadge;
