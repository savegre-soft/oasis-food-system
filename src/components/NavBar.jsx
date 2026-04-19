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
  Search,
  HamburgerIcon,
  Utensils,
  ChevronDown,
  Settings,
  Handbag,
  ChartScatterIcon,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

const links = [
  { to: '/Main', label: 'Dashboards', icon: Home },
  { to: '/entregas', label: 'Entregas', icon: RouteIcon },
  { to: '/orders', label: 'Órdenes', icon: Handbag },
  { to: '/settings', label: 'Configuracion', icon: Settings },
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

const allLinks = [...links, ...gestionLinks, ...financialLinks];

export default function Navbar() {
  const nav = useNavigate();
  const { supabase, user, theme, setTheme } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  // Búsqueda
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const navRef = useRef(null);

  // ── Búsqueda ────────────────────────────────────────────────────────────────

  function openSearch() {
    setSearchExpanded(true);
    // Espera al siguiente frame para que el input sea visible antes de focusearlo
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setSearchExpanded(false);
    setSearchQuery('');
    setSearchResults([]);
  }

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearchResults(allLinks.filter((l) => l.label.toLowerCase().includes(q)));
  }, [searchQuery]);

  function handleSearchSelect(to) {
    closeSearch();
    nav(to);
  }

  // Cerrar con Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') closeSearch();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Click fuera ─────────────────────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
      if (searchRef.current && !searchRef.current.contains(e.target)) closeSearch();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Auth ─────────────────────────────────────────────────────────────────────

  async function handleLogout() {
    setOpenMenu(null);
    setIsOpen(false);
    await supabase.auth.signOut();
    nav('/login');
  }

  function toggleMenu(menu) {
    setOpenMenu(openMenu === menu ? null : menu);
  }

  // ── Tema ─────────────────────────────────────────────────────────────────────

  function cycleTheme() {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  }

  const themeConfig = {
    light: { Icon: Sun, label: 'Claro' },
    dark: { Icon: Moon, label: 'Oscuro' },
    system: { Icon: Monitor, label: 'Sistema' },
  };
  const { Icon: ThemeIcon, label: themeLabel } = themeConfig[theme];

  const baseStyle =
    'px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2';

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 bg-green-800/95 backdrop-blur-md text-white shadow-lg"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <h1 className="text-lg font-bold tracking-wide">Oasis Food</h1>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {/* ── Barra de búsqueda colapsable ── */}
          <div ref={searchRef} className="relative flex items-center">
            {/* Input — se expande/colapsa con max-width */}
            <div
              className={`flex items-center overflow-hidden rounded-lg transition-all duration-300 ease-in-out ${
                searchExpanded ? 'max-w-xs bg-white/20 px-3 py-1.5 gap-2' : 'max-w-0 px-0 py-0'
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sección..."
                className="bg-transparent text-white placeholder-white/50 text-sm outline-none w-44"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="text-white/60 hover:text-white transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Botón lupa / cerrar */}
            <button
              onClick={searchExpanded ? closeSearch : openSearch}
              title={searchExpanded ? 'Cerrar búsqueda' : 'Buscar'}
              className="p-2 rounded-lg hover:bg-green-700 transition-colors shrink-0"
            >
              {searchExpanded ? <X size={18} /> : <Search size={18} />}
            </button>

            {/* Dropdown de resultados */}
            {searchExpanded && (searchResults.length > 0 || searchQuery.trim()) && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white text-green-800 rounded-xl shadow-xl py-2 z-50">
                {searchResults.length > 0 ? (
                  searchResults.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.to}
                        onClick={() => handleSearchSelect(link.to)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-100 text-left"
                      >
                        <Icon size={15} />
                        {link.label}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-4 py-2 text-sm text-gray-400">Sin resultados</p>
                )}
              </div>
            )}
          </div>

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

          {/* ── Botón de tema ── */}
          <button
            onClick={cycleTheme}
            title={`Tema: ${themeLabel}`}
            className="p-2 rounded-lg hover:bg-green-700 transition flex items-center gap-1.5 text-sm"
          >
            <ThemeIcon size={18} />
          </button>

          {/* ── Perfil ── */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('profile')}
              className="p-2 rounded-full hover:bg-green-700 transition"
            >
              <User size={22} />
            </button>

            {openMenu === 'profile' && (
              <div className="absolute right-0 mt-3 w-52 bg-white text-green-800 rounded-xl shadow-xl py-2">
                {user && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-b truncate">
                    {user.email}
                  </div>
                )}

                <button
                  onClick={() => {
                    setOpenMenu(null);
                    nav('/perfil');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-100"
                >
                  <User size={16} />
                  Perfil
                </button>

                <div className="px-4 py-2 border-t border-b">
                  <p className="text-xs text-gray-400 mb-2">Apariencia</p>
                  <div className="flex rounded-lg overflow-hidden border border-green-200">
                    {[
                      { key: 'light', Icon: Sun, label: 'Claro' },
                      { key: 'dark', Icon: Moon, label: 'Oscuro' },
                      { key: 'system', Icon: Monitor, label: 'Auto' },
                    ].map(({ key, Icon: Ic, label }) => (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-xs transition-colors ${
                          theme === key
                            ? 'bg-green-700 text-white'
                            : 'hover:bg-green-50 text-green-700'
                        }`}
                      >
                        <Ic size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

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
          {/* Búsqueda mobile — siempre visible en el menú abierto */}
          <div className="relative mt-2">
            <div className="flex items-center bg-white/15 rounded-lg px-3 py-2 gap-2">
              <Search size={16} className="text-white/70 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="bg-transparent text-white placeholder-white/50 text-sm outline-none flex-1"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X size={14} className="text-white/60" />
                </button>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white text-green-800 rounded-xl shadow-xl py-2 z-50">
                {searchResults.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.to}
                      onClick={() => {
                        handleSearchSelect(link.to);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-100"
                    >
                      <Icon size={15} />
                      {link.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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

          <div className="flex rounded-lg overflow-hidden border border-green-600 mt-1">
            {[
              { key: 'light', Icon: Sun, label: 'Claro' },
              { key: 'dark', Icon: Moon, label: 'Oscuro' },
              { key: 'system', Icon: Monitor, label: 'Auto' },
            ].map(({ key, Icon: Ic, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs transition-colors ${
                  theme === key
                    ? 'bg-white text-green-800 font-medium'
                    : 'text-white/70 hover:bg-green-700'
                }`}
              >
                <Ic size={14} />
                {label}
              </button>
            ))}
          </div>

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

/* ── Dropdown ─────────────────────────────────────────────────────────────── */

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
                onClick={() => toggleMenu(menuKey)}
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
