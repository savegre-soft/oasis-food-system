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
