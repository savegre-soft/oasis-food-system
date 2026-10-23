// Datos de marca y contacto del sitio público. Centralizados acá para no
// repetir strings mágicos (zonas de entrega, WhatsApp, Instagram) en cada página.

export const WHATSAPP_LINK = 'https://wa.me/message/ZYFLIBTMILUPK1';

export const INSTAGRAM_OASIS = { handle: '@oasis_meals', url: 'https://instagram.com/oasis_meals' };
export const INSTAGRAM_WELLSHOT = {
  handle: '@wellshot_byoasis',
  url: 'https://instagram.com/wellshot_byoasis',
};

export const DELIVERY_ZONES = ['Ciudad Quesada', 'La Fortuna', 'Florencia', 'Aguas Zarcas'];

export const ORDER_CUTOFF = 'Cerramos pedidos los viernes a medianoche';

export const NAV_LINKS = [
  { name: 'Inicio', path: '/' },
  { name: 'Menú', path: '/menu' },
  { name: 'Well Shot', path: '/well-shot' },
  { name: 'Promociones', path: '/promociones' },
  { name: 'Nosotros', path: '/nosotros' },
  { name: 'Contacto', path: '/contacto' },
];

export const FOOTER_NAV_LINKS = [
  { name: 'Inicio', path: '/' },
  { name: 'Menú', path: '/menu' },
  { name: 'Well Shot', path: '/well-shot' },
  { name: 'Promociones', path: '/promociones' },
  { name: 'Catering', path: '/catering' },
  { name: 'Nosotros', path: '/nosotros' },
];

// Datos estructurados del negocio (schema.org FoodEstablishment) para SEO local.
// Se inyecta como JSON-LD en la página de inicio vía <Seo jsonLd={...} />.
// Las zonas de cobertura salen de DELIVERY_ZONES; los perfiles sociales de
// INSTAGRAM_*. Cuando tengas dirección y teléfono fijos, agregalos acá.
export const BUSINESS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  name: 'Oasis',
  description:
    'Comida preparada saludable y balanceada en la Zona Norte de Costa Rica, con entrega bajo pedido por ruta. También Well Shot (shots funcionales) y catering para eventos.',
  servesCuisine: 'Comida saludable',
  priceRange: '₡₡',
  url: 'https://oasis-meals.com',
  image: 'https://oasis-meals.com/assets/Oasis-logo.png',
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'Alajuela',
    addressCountry: 'CR',
  },
  areaServed: DELIVERY_ZONES.map((zone) => ({ '@type': 'City', name: zone })),
  sameAs: [INSTAGRAM_OASIS.url, INSTAGRAM_WELLSHOT.url],
};
