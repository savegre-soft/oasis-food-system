import { Helmet } from 'react-helmet-async';
import LogoUrl from '../../assets/Oasis-logo.png';

const SITE_NAME = 'Oasis';
const SITE_URL = 'https://oasis-meals.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}${LogoUrl}`;

// Términos de marca que suman a casi cualquier página del sitio (comida
// preparada saludable, zona de cobertura) — cada página puede sumar los
// suyos propios encima vía `keywords`.
const BASE_KEYWORDS = [
  'comida saludable',
  'comida preparada',
  'meal prep Costa Rica',
  'Zona Norte Costa Rica',
];

/**
 * Título, descripción, canonical y Open Graph/Twitter por página — necesario
 * porque esto es una SPA de Vite sin SSR: sin esto, las 10 páginas públicas
 * comparten el mismo <title> y no hay preview al compartir un link por
 * WhatsApp/Instagram (los canales reales del negocio).
 */
const Seo = ({ title, description, path = '/', keywords = [], noindex = false }) => {
  const fullTitle = `${title} · ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;
  const allKeywords = [...new Set([...keywords, ...BASE_KEYWORDS])].join(', ');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:locale" content="es_CR" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
    </Helmet>
  );
};

export default Seo;
