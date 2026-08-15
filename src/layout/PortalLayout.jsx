import { Outlet } from 'react-router-dom';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LogoUrl from '../assets/Oasis-logo.png';

const THEME_OPTIONS = [
  { key: 'light', Icon: Sun, label: 'Claro' },
  { key: 'dark', Icon: Moon, label: 'Oscuro' },
  { key: 'system', Icon: Monitor, label: 'Auto' },
];

// Layout del portal de clientes (/portal/:token) — sin sesión, sin navbar
// interna ni sitio de marketing. Mismo lenguaje visual que Login.jsx.
// El selector de tema reusa theme/setTheme de AppContext.jsx (misma lógica
// que ya aplica la clase `dark` al <html>, no se reimplementa nada) — mismo
// patrón visual que ya existe en NavBar.jsx.
export default function PortalLayout() {
  const { theme, setTheme } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src={LogoUrl} className="w-10" alt="Oasis Food" />
            <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400">Oasis Food</span>
          </div>

          <div className="flex rounded-lg overflow-hidden border border-emerald-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60">
            {/* eslint-disable-next-line no-unused-vars -- Icon usado abajo como <Icon />, no-unused-vars no lo detecta en este patrón */}
            {THEME_OPTIONS.map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                title={label}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                  theme === key
                    ? 'bg-emerald-700 text-white'
                    : 'text-emerald-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
