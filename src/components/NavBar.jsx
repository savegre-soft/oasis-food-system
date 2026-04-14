import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  RouteIcon,
  Menu,
  X,
  DollarSign,
  User,
  LogOut,
  HamburgerIcon,
  Utensils,
  ChevronDown,
  Handbag,
  ChartScatterIcon,
} from 'lucide-react';

import { useApp } from '../context/AppContext'; // ✅ IMPORTAR CONTEXTO

const links = [
  { to: '/Main', label: 'Dashboards', icon: Home },
  { to: '/entregas', label: 'Entregas', icon: RouteIcon },
  { to: '/orders', label: 'Órdenes', icon: Handbag },
];

const gestionLinks = [
  { to: '/Clientes', label: 'Clientes', icon: Users },
  { to: '/menus', label: 'Recetas', icon: HamburgerIcon },
  { to: '/routes', label: 'Rutas', icon: RouteIcon },
  { to: '/templates', label: 'Menús Predefinidos', icon: Utensils },
];

const financialLinks = [
  { to: '/pagos', label: 'Pagos', icon: DollarSign },
  { to: '/Gastos', label: 'Gastos', icon: DollarSign },
  { to: '/estadisticas', label: 'Estadísticas', icon: ChartScatterIcon },
];

export default function Navbar() {
  const nav = useNavigate();
  const { supabase, user } = useApp(); // ✅ USAR CONTEXTO

  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const navRef = useRef(null);

  async function handleLogout() {
    setOpenMenu(null);
    setIsOpen(false);

    await supabase.auth.signOut(); // ✅ LOGOUT REAL

    nav('/login');
  }

  function toggleMenu(menu) {
    setOpenMenu(openMenu === menu ? null : menu);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseStyle =
    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2';

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 bg-green-800/95 backdrop-blur-md text-white shadow-lg"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <h1 className="text-lg font-bold tracking-wide">Oasis Food</h1>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${baseStyle} ${
                    isActive
                      ? 'bg-white text-green-800 shadow-md'
                      : 'hover:bg-green-700 hover:scale-105'
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}

          <Dropdown
            label="Gestión"
            menuKey="gestion"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            links={gestionLinks}
            baseStyle={baseStyle}
          />

          <Dropdown
            label="Finanzas"
            menuKey="finanzas"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            links={financialLinks}
            baseStyle={baseStyle}
          />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('profile')}
              className="p-2 rounded-full hover:bg-green-700 transition"
            >
              <User size={22} />
            </button>

            {openMenu === 'profile' && (
              <div className="absolute right-0 mt-3 w-48 bg-white text-green-800 rounded-xl shadow-xl py-2">
                {/* Usuario logueado */}
                {user && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-b">{user.email}</div>
                )}

                <button
                  onClick={() => { setOpenMenu(null); nav('/perfil'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-100"
                >
                  <User size={16} />
                  Perfil
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-100 text-red-600"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-green-700"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-2 bg-green-800">
          {[...links, ...gestionLinks, ...financialLinks].map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `${baseStyle} ${isActive ? 'bg-white text-green-800' : 'hover:bg-green-700'}`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}

          {/* Logout mobile */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-300 hover:bg-red-700 rounded-lg"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}

/* Dropdown */

function Dropdown({ label, menuKey, openMenu, toggleMenu, links, baseStyle }) {
  return (
    <div className="relative">
      <button onClick={() => toggleMenu(menuKey)} className={`${baseStyle} hover:bg-green-700`}>
        {label}
        <ChevronDown size={16} />
      </button>

      {openMenu === menuKey && (
        <div className="absolute mt-2 w-56 bg-white text-green-800 rounded-xl shadow-xl py-2">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-100"
              >
                <Icon size={16} />
                {link.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
