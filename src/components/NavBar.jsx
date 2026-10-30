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
  Salad,
  Package,
  PackageCheck,
  ChefHat,
  Zap,
  Sun,
  Moon,
  Monitor,
  Boxes,
  Layers,
  // UserPlus, Megaphone — solo usados por los links de Prospectos/Promociones,
  // ocultos temporalmente más abajo.
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import LogoUrl from '../assets/Oasis-logo.png';

const links = [
  { to: '/Main', label: 'Dashboards', icon: Home },
  // Oculto a pedido del usuario (2026-08-13) — se reactiva más adelante.
  // { to: '/prospectos', label: 'Prospectos', icon: UserPlus },
];

const ordersLinks = [
  { to: '/orders', label: 'Órdenes', icon: Handbag },
  { to: '/combos', label: 'Combos', icon: Package },
  { to: '/ventas-masivas', label: 'Ventas', icon: Boxes },
];

const entregasLinks = [
  { to: '/entregas', label: 'Producción', icon: ChefHat },
  { to: '/entregas/express', label: 'Express', icon: Zap },
  { to: '/entregas/combos', label: 'Combos', icon: PackageCheck },
];

const gestionLinks = [
  { to: '/Clientes', label: 'Clientes', icon: Users },
  { to: '/menus', label: 'Platos', icon: HamburgerIcon },
  { to: '/routes', label: 'Rutas', icon: RouteIcon },
  { to: '/templates', label: 'Menús Predefinidos', icon: Utensils },
  { to: '/combo-items', label: 'Ítems de Combo', icon: Salad },
  { to: '/platos-venta-masiva', label: 'Platos de Venta', icon: Layers },
  // Oculto a pedido del usuario (2026-08-13) — se reactiva más adelante.
  // { to: '/promociones-admin', label: 'Promociones', icon: Megaphone },
];

const financialLinks = [
  { to: '/pagos', label: 'Pagos', icon: DollarSign },
  { to: '/Gastos', label: 'Gastos', icon: DollarSign },
  { to: '/planilla', label: 'Planilla', icon: Users },
  { to: '/estadisticas', label: 'Estadísticas', icon: ChartScatterIcon },
];

const allLinks = [...links, ...ordersLinks, ...entregasLinks, ...gestionLinks, ...financialLinks];

export default function Navbar() {
  const nav = useNavigate();
  const { supabase, user, theme, setTheme } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  // Búsqueda
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkResults, setLinkResults] = useState([]);
  const [clientResults, setClientResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navRef = useRef(null);
  const debounceRef = useRef(null); // ← referencia al timer del debounce

  // ── Búsqueda ──────────────────────────────────────────────────────────────

  function openSearch() {
    setSearchExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setSearchExpanded(false);
    setSearchQuery('');
    setLinkResults([]);
    setClientResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  // Filtra links localmente (instantáneo) y clientes con debounce
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();

    // Limpiar timer anterior
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q) {
      setLinkResults([]);
      setClientResults([]);
      setSearchLoading(false);
      return;
    }

    // Links: filtrado local, sin petición
    setLinkResults(allLinks.filter((l) => l.label.toLowerCase().includes(q)));

    // Clientes: espera 350ms sin tipear antes de consultar
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .schema('operations')
          .from('clients')
          .select('id_client, name')
          .ilike('name', `%${q.trim()}%`)
          .limit(6);

        if (error) throw error;
        setClientResults(data || []);
      } catch (err) {
        console.error(err);
        setClientResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    // Limpiar el timer si el componente se desmonta o el query cambia
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, supabase]);

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

  // Click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
      if (searchRef.current && !searchRef.current.contains(e.target)) closeSearch();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function handleLogout() {
    setOpenMenu(null);
    setIsOpen(false);
    await supabase.auth.signOut();
    nav('/login');
  }

  function toggleMenu(menu) {
    setOpenMenu(openMenu === menu ? null : menu);
  }

  // ── Tema ──────────────────────────────────────────────────────────────────

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
    'px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2';

  // ¿Hay algo que mostrar en el dropdown?
  const hasResults = linkResults.length > 0 || clientResults.length > 0;
  const showDropdown = searchExpanded && (hasResults || searchLoading || searchQuery.trim());

  // ── Dropdown de resultados (reutilizado en desktop y mobile) ──────────────

  function SearchResults({ onSelect }) {
    return (
      <div className="absolute top-full right-0 mt-2 w-64 bg-oasis-paper dark:bg-slate-800 rounded-xl shadow-xl py-2 z-50 border border-oasis-olive-100 dark:border-slate-700">
        {/* Secciones */}
        {linkResults.length > 0 && (
          <>
            <p className="px-4 pt-1 pb-1 text-xs font-semibold text-oasis-ink/40 dark:text-slate-500 uppercase tracking-wide">
              Secciones
            </p>
            {linkResults.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.to}
                  onClick={() => onSelect(link.to)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-oasis-olive-800 dark:text-oasis-olive-300 hover:bg-oasis-olive-50 dark:hover:bg-oasis-olive-900/30 text-left"
                >
                  <Icon size={15} />
                  {link.label}
                </button>
              );
            })}
          </>
        )}

        {/* Clientes */}
        {(searchLoading || clientResults.length > 0) && (
          <>
            <p
              className={`px-4 pb-1 text-xs font-semibold text-oasis-ink/40 dark:text-slate-500 uppercase tracking-wide ${linkResults.length > 0 ? 'pt-3 border-t border-oasis-olive-100 dark:border-slate-700 mt-1' : 'pt-1'}`}
            >
              Clientes
            </p>
            {searchLoading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="w-3 h-3 border-2 border-oasis-olive-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-oasis-ink/40 dark:text-slate-500">Buscando...</span>
              </div>
            ) : (
              clientResults.map((client) => (
                <button
                  key={client.id_client}
                  onClick={() => onSelect(`/cliente/${client.id_client}`)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-oasis-ink/80 dark:text-slate-200 hover:bg-oasis-olive-50 dark:hover:bg-oasis-olive-900/30 text-left"
                >
                  <Users size={15} className="text-oasis-ink/30 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{client.name}</span>
                </button>
              ))
            )}
          </>
        )}

        {/* Sin resultados */}
        {!searchLoading && !hasResults && searchQuery.trim() && (
          <p className="px-4 py-2 text-sm text-oasis-ink/40 dark:text-slate-500">Sin resultados</p>
        )}
      </div>
    );
  }

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 bg-oasis-paper/95 dark:bg-slate-900/95 backdrop-blur-sm text-oasis-ink dark:text-slate-100 border-b border-oasis-olive-100 dark:border-slate-800 shadow-sm"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <img src={LogoUrl} alt="Oasis Food" className="h-10 w-10 rounded-full object-cover shrink-0" />
          <span className="hidden sm:block leading-tight">
            <span className="block font-display font-semibold text-base text-oasis-ink dark:text-slate-100">
              Oasis
            </span>
            <span className="block text-[10px] tracking-[0.18em] uppercase text-oasis-olive-600 dark:text-oasis-olive-400">
              Panel operativo
            </span>
          </span>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {/* ── Barra de búsqueda colapsable ── */}
          <div ref={searchRef} className="relative flex items-center">
            <div
              className={`flex items-center overflow-hidden rounded-full transition-all duration-300 ease-in-out ${
                searchExpanded
                  ? 'max-w-xs bg-oasis-olive-50 dark:bg-slate-800 px-3 py-1.5 gap-2 border border-oasis-olive-100 dark:border-slate-700'
                  : 'max-w-0 px-0 py-0'
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sección o cliente..."
                className="bg-transparent text-oasis-ink dark:text-slate-100 placeholder-oasis-ink/40 dark:placeholder-slate-500 text-sm outline-none w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="text-oasis-ink/40 hover:text-oasis-ink dark:text-slate-500 dark:hover:text-slate-200 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={searchExpanded ? closeSearch : openSearch}
              title={searchExpanded ? 'Cerrar búsqueda' : 'Buscar'}
              className="p-2 rounded-full hover:bg-oasis-olive-50 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {searchExpanded ? <X size={18} /> : <Search size={18} />}
            </button>

            {showDropdown && <SearchResults onSelect={handleSearchSelect} />}
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
                      ? 'bg-oasis-olive-600 text-white shadow-sm'
                      : 'text-oasis-ink/80 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}

          <Dropdown
            label="Pedidos"
            menuKey="pedidos"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            links={ordersLinks}
            baseStyle={baseStyle}
          />
          <Dropdown
            label="Entregas"
            menuKey="entregas"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            links={entregasLinks}
            baseStyle={baseStyle}
          />
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

          <button
            onClick={cycleTheme}
            title={`Tema: ${themeLabel}`}
            className="p-2 rounded-full text-oasis-ink/70 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-sm"
          >
            <ThemeIcon size={18} />
          </button>

          {/* Perfil */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('profile')}
              className="p-2 rounded-full text-oasis-ink/70 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800 transition"
            >
              <User size={22} />
            </button>

            {openMenu === 'profile' && (
              <div className="absolute right-0 mt-3 w-52 bg-oasis-paper dark:bg-slate-800 text-oasis-olive-800 dark:text-oasis-olive-300 rounded-xl shadow-xl py-2 border border-oasis-olive-100 dark:border-slate-700">
                {user && (
                  <div className="px-4 py-2 text-xs text-oasis-ink/50 dark:text-slate-400 border-b border-oasis-olive-100 dark:border-slate-700 truncate">
                    {user.email}
                  </div>
                )}

                <button
                  onClick={() => {
                    setOpenMenu(null);
                    nav('/perfil');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-oasis-olive-50 dark:hover:bg-oasis-olive-900/30"
                >
                  <User size={16} />
                  Perfil
                </button>

                <button
                  onClick={() => {
                    setOpenMenu(null);
                    nav('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-oasis-olive-50 dark:hover:bg-oasis-olive-900/30"
                >
                  <Settings size={16} />
                  Configuración
                </button>

                <div className="px-4 py-2 border-t border-b border-oasis-olive-100 dark:border-slate-700">
                  <p className="text-xs text-oasis-ink/40 dark:text-slate-500 mb-2">Apariencia</p>
                  <div className="flex rounded-full overflow-hidden border border-oasis-olive-200 dark:border-slate-700">
                    {[
                      { key: 'light', Icon: Sun, label: 'Claro' },
                      { key: 'dark', Icon: Moon, label: 'Oscuro' },
                      { key: 'system', Icon: Monitor, label: 'Auto' },
                    // eslint-disable-next-line no-unused-vars -- Ic renders as <Ic/> below; no-unused-vars doesn't see JSX tag usage of a mapped/destructured var
                    ].map(({ key, Icon: Ic, label }) => (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-xs transition-colors ${
                          theme === key
                            ? 'bg-oasis-olive-600 text-white'
                            : 'hover:bg-oasis-olive-50 dark:hover:bg-oasis-olive-900/30 text-oasis-olive-700 dark:text-oasis-olive-400'
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
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-oasis-rose/40 dark:hover:bg-red-900/20 text-oasis-terracotta-dark dark:text-red-400"
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
          className="md:hidden p-2 rounded-full text-oasis-ink dark:text-slate-100 hover:bg-oasis-olive-50 dark:hover:bg-slate-800"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-2 bg-oasis-paper dark:bg-slate-900 border-t border-oasis-olive-100 dark:border-slate-800">
          <div ref={searchRef} className="relative mt-2">
            <div className="flex items-center bg-oasis-olive-50 dark:bg-slate-800 border border-oasis-olive-100 dark:border-slate-700 rounded-full px-3 py-2 gap-2">
              <Search size={16} className="text-oasis-ink/40 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sección o cliente..."
                className="bg-transparent text-oasis-ink dark:text-slate-100 placeholder-oasis-ink/40 dark:placeholder-slate-500 text-sm outline-none flex-1"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X size={14} className="text-oasis-ink/40 dark:text-slate-500" />
                </button>
              )}
            </div>
            {(hasResults || searchLoading) && searchQuery.trim() && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-oasis-paper dark:bg-slate-800 rounded-xl shadow-xl py-2 z-50 border border-oasis-olive-100 dark:border-slate-700">
                {linkResults.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.to}
                      onClick={() => {
                        handleSearchSelect(link.to);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-oasis-olive-800 dark:text-oasis-olive-300 hover:bg-oasis-olive-50 dark:hover:bg-oasis-olive-900/30"
                    >
                      <Icon size={15} />
                      {link.label}
                    </button>
                  );
                })}
                {searchLoading ? (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-3 h-3 border-2 border-oasis-olive-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-oasis-ink/40 dark:text-slate-500">Buscando clientes...</span>
                  </div>
                ) : (
                  clientResults.map((client) => (
                    <button
                      key={client.id_client}
                      onClick={() => {
                        handleSearchSelect(`/customers/${client.id_client}`);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-oasis-ink/80 dark:text-slate-200 hover:bg-oasis-olive-50 dark:hover:bg-oasis-olive-900/30"
                    >
                      <Users size={15} className="text-oasis-ink/30 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{client.name}</span>
                    </button>
                  ))
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
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `${baseStyle} ${
                    isActive
                      ? 'bg-oasis-olive-600 text-white'
                      : 'text-oasis-ink/80 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}

          <MobileDropdown
            label="Pedidos"
            menuKey="pedidos"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            links={ordersLinks}
            baseStyle={baseStyle}
            onNavigate={() => setIsOpen(false)}
          />
          <MobileDropdown
            label="Entregas"
            menuKey="entregas"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            links={entregasLinks}
            baseStyle={baseStyle}
            onNavigate={() => setIsOpen(false)}
          />
          <MobileDropdown
            label="Gestión"
            menuKey="gestion"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            links={gestionLinks}
            baseStyle={baseStyle}
            onNavigate={() => setIsOpen(false)}
          />
          <MobileDropdown
            label="Finanzas"
            menuKey="finanzas"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            links={financialLinks}
            baseStyle={baseStyle}
            onNavigate={() => setIsOpen(false)}
          />

          <div className="flex rounded-full overflow-hidden border border-oasis-olive-200 dark:border-slate-700 mt-1">
            {[
              { key: 'light', Icon: Sun, label: 'Claro' },
              { key: 'dark', Icon: Moon, label: 'Oscuro' },
              { key: 'system', Icon: Monitor, label: 'Auto' },
              // eslint-disable-next-line no-unused-vars -- Ic renders as <Ic/> below; no-unused-vars doesn't see JSX tag usage of a mapped/destructured var
            ].map(({ key, Icon: Ic, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs transition-colors ${
                  theme === key
                    ? 'bg-oasis-olive-600 text-white font-medium'
                    : 'text-oasis-ink/70 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800'
                }`}
              >
                <Ic size={14} />
                {label}
              </button>
            ))}
          </div>

          <NavLink
            to="/settings"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `${baseStyle} ${
                isActive
                  ? 'bg-oasis-olive-600 text-white'
                  : 'text-oasis-ink/80 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800'
              }`
            }
          >
            <Settings size={18} />
            Configuración
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-oasis-terracotta-dark dark:text-red-400 hover:bg-oasis-rose/40 dark:hover:bg-red-900/20 rounded-full"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}

/* ── Dropdown ───────────────────────────────────────────────────────────────── */

function Dropdown({ label, menuKey, openMenu, toggleMenu, links, baseStyle }) {
  return (
    <div className="relative">
      <button
        onClick={() => toggleMenu(menuKey)}
        className={`${baseStyle} text-oasis-ink/80 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800`}
      >
        {label}
        <ChevronDown size={16} />
      </button>

      {openMenu === menuKey && (
        <div className="absolute mt-2 w-56 bg-oasis-paper dark:bg-slate-800 text-oasis-olive-800 dark:text-oasis-olive-300 rounded-xl shadow-xl py-2 border border-oasis-olive-100 dark:border-slate-700">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => toggleMenu(menuKey)}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-oasis-olive-50 dark:hover:bg-oasis-olive-900/30"
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

// Mismo grupo que Dropdown pero como acordeón vertical, para el menú móvil.
function MobileDropdown({ label, menuKey, openMenu, toggleMenu, links, baseStyle, onNavigate }) {
  const open = openMenu === menuKey;
  return (
    <div>
      <button
        onClick={() => toggleMenu(menuKey)}
        className={`${baseStyle} w-full justify-between text-oasis-ink/80 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800`}
      >
        {label}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="pl-3 flex flex-col gap-1 mt-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `${baseStyle} ${
                    isActive
                      ? 'bg-oasis-olive-600 text-white'
                      : 'text-oasis-ink/80 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
