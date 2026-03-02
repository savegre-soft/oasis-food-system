import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const PublicNavBar = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { name: 'Inicio', path: '/' },
    { name: 'Menú', path: '/menu' },
    { name: 'Promociones', path: '/promociones' },
    { name: 'Contacto', path: '/contacto' },
    { name: 'Login', path: '/login' },
  ];

  return (
    <header className="w-full bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold tracking-wide hover:opacity-90 transition">
          Oasis Food
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `font-medium transition hover:text-emerald-200 ${
                  isActive ? 'text-emerald-200' : 'text-white'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          <Link
            to="/ordenar"
            className="bg-white text-emerald-700 px-5 py-2 rounded-2xl font-semibold shadow-md hover:scale-105 hover:bg-emerald-50 transition"
          >
            Ordenar
          </Link>
        </nav>

        {/* Mobile Button */}
        <button onClick={() => setOpen(!open)} className="md:hidden" aria-label="Toggle menu">
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-green-700/95 backdrop-blur-sm px-6 pb-6 space-y-4 animate-in slide-in-from-top duration-300">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block py-2 text-lg font-medium rounded-lg transition ${
                  isActive ? 'text-emerald-200' : 'text-white hover:text-emerald-200'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          <Link
            to="/ordenar"
            onClick={() => setOpen(false)}
            className="block text-center bg-white text-emerald-700 py-3 rounded-2xl font-semibold shadow-md hover:bg-emerald-50 transition"
          >
            Ordenar Ahora
          </Link>
        </div>
      )}
    </header>
  );
};

export default PublicNavBar;
