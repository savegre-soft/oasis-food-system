// Oasis todavía no tiene banco de fotos propio cargado en todas las páginas
// públicas. Mientras tanto usamos bloques de color con un pie de foto, igual
// que el mockup de Figma marca "Foto: ..." en los lugares sin imagen final.
const TONES = {
  sage: 'bg-oasis-sage',
  rose: 'bg-oasis-rose',
  butter: 'bg-oasis-butter',
  sand: 'bg-oasis-sand',
  olive: 'bg-oasis-olive-100',
  cream: 'bg-oasis-cream-dark',
};

const PlaceholderImage = ({ tone = 'sage', caption, className = '', rounded = 'rounded-3xl' }) => (
  <div className={`relative overflow-hidden ${rounded} ${TONES[tone] ?? TONES.sage} ${className}`}>
    {caption && (
      <span className="absolute bottom-3 left-3 bg-white/85 text-oasis-ink text-xs px-3 py-1 rounded-full shadow-sm">
        {caption}
      </span>
    )}
  </div>
);

export default PlaceholderImage;
