import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- motion se usa como <motion.*> abajo
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import LogoUrl from './../assets/Oasis-logo.png';
import { NAV_LINKS } from '../lib/siteContent';
import { EASE } from '../lib/motion';

const PublicNavBar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-oasis-paper/95 backdrop-blur-sm border-b border-oasis-olive-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img
            src={LogoUrl}
            className="w-10 h-10 rounded-full object-cover"
            alt="Oasis"
            whileHover={{ scale: 1.06, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          />
          <span className="leading-tight">
            <span className="block font-display font-semibold text-lg text-oasis-ink transition-colors group-hover:text-oasis-olive-700">
              Oasis
            </span>
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
                `relative text-sm font-medium transition-colors hover:text-oasis-olive-600 ${
                  isActive ? 'text-oasis-olive-700' : 'text-oasis-ink/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.name}
                  {/* Subrayado animado que se desliza bajo el enlace activo. */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-oasis-olive-600"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/ordenar"
              className="block bg-oasis-olive-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:bg-oasis-olive-700 transition-colors"
            >
              Ordenar
            </Link>
          </motion.div>
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-oasis-ink"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="lg:hidden overflow-hidden bg-oasis-paper border-t border-oasis-olive-100"
          >
            <div className="px-6 pb-6 pt-2 space-y-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block py-2.5 text-base font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-oasis-olive-700'
                        : 'text-oasis-ink/80 hover:text-oasis-olive-600'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}

              <Link
                to="/ordenar"
                onClick={() => setOpen(false)}
                className="block text-center bg-oasis-olive-600 text-white py-3 mt-2 rounded-full font-semibold shadow-sm hover:bg-oasis-olive-700 transition-colors active:scale-[0.98]"
              >
                Ordenar
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicNavBar;
