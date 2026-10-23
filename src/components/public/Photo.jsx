// Imagen real del sitio público — reemplaza a PlaceholderImage donde ya hay
// foto cargada en /public/photos. Mantiene la misma API (className/rounded) para
// sustituir sin tocar el layout; añade object-cover, alt obligatorio y carga
// diferida por defecto (el hero principal pasa loading="eager").
const Photo = ({
  src,
  alt,
  className = '',
  rounded = 'rounded-3xl',
  loading = 'lazy',
  fetchPriority = 'auto',
}) => (
  <img
    src={src}
    alt={alt}
    loading={loading}
    fetchPriority={fetchPriority}
    className={`w-full object-cover ${rounded} ${className}`}
  />
);

export default Photo;
