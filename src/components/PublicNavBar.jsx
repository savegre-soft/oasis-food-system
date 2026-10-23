import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import LogoUrl from './../assets/Oasis-logo.png';
import { NAV_LINKS } from '../lib/siteContent';

const PublicNavBar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-oasis-paper/95 backdrop-blur-sm border-b border-oasis-olive-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <img src={LogoUrl} className="w-10 h-10 rounded-full object-cover" alt="Oasis" />
          <span className="leading-tight">
            <span className="block font-display font-semibold text-lg text-oasis-ink">Oasis</span>
            <span className="block text-[10px] tracking-[0.2em] uppercase text-oasis-olive-500">
              Comida preparada
            </span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `text-sm font-medium transition hover:text-oasis-olive-600 ${
                  isActive ? 'text-oasis-olive-700' : 'text-oasis-ink/80'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link
            to="/ordenar"
            className="bg-oasis-olive-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:bg-oasis-olive-700 transition"
          >
            Ordenar
          </Link>
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-oasis-ink"
          aria-label="Abrir menú"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-oasis-paper border-t border-oasis-olive-100 px-6 pb-6 space-y-3">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block py-2 text-base font-medium rounded-lg transition ${
                  isActive ? 'text-oasis-olive-700' : 'text-oasis-ink/80 hover:text-oasis-olive-600'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          <Link
            to="/ordenar"
            onClick={() => setOpen(false)}
            className="block text-center bg-oasis-olive-600 text-white py-3 rounded-full font-semibold shadow-sm hover:bg-oasis-olive-700 transition"
          >
            Ordenar
          </Link>
        </div>
      )}
    </header>
  );
};

export default PublicNavBar;
