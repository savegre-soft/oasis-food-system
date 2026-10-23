import { Link } from 'react-router-dom';
import {
  DELIVERY_ZONES,
  INSTAGRAM_OASIS,
  INSTAGRAM_WELLSHOT,
  WHATSAPP_LINK,
} from '../../lib/siteContent';

const PublicFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-oasis-olive-900 text-oasis-cream-dark">
      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl text-white">Oasis</p>
          <p className="mt-3 text-sm text-oasis-olive-200 max-w-xs">
            Comida saludable, deliciosa y balanceada, entregada bajo pedido.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-oasis-olive-300 mb-4">
            Navegación
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-white transition">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/menu" className="hover:text-white transition">
                Menú
              </Link>
            </li>
            <li>
              <Link to="/well-shot" className="hover:text-white transition">
                Well Shot
              </Link>
            </li>
            <li>
              <Link to="/promociones" className="hover:text-white transition">
                Promociones
              </Link>
            </li>
            <li>
              <Link to="/catering" className="hover:text-white transition">
                Catering
              </Link>
            </li>
            <li>
              <Link to="/nosotros" className="hover:text-white transition">
                Nosotros
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-oasis-olive-300 mb-4">
            Entregas
          </p>
          <ul className="space-y-2 text-sm">
            {DELIVERY_ZONES.map((zone) => (
              <li key={zone}>{zone}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-oasis-olive-300 mb-4">
            Contacto
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={INSTAGRAM_OASIS.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition"
              >
                {INSTAGRAM_OASIS.handle}
              </a>
            </li>
            <li>
              <a
                href={INSTAGRAM_WELLSHOT.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition"
              >
                {INSTAGRAM_WELLSHOT.handle}
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-white transition">
                Login clientes
              </Link>
            </li>
            <li>
              <Link to="/politica-privacidad" className="hover:text-white transition">
                Política de privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs text-oasis-olive-300 text-center">
          © {year} Oasis · Comida preparada & Catering Service
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
