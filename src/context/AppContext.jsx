import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * @typedef {import('@supabase/supabase-js').Session} Session
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').SupabaseClient} SupabaseClient
 */

/**
 * @typedef {'light' | 'dark' | 'system'} ThemeMode
 */

/**
 * @typedef {Object} AppContextValue
 * @property {SupabaseClient} supabase - Instancia de Supabase
 * @property {Session|null} session - Sesión actual
 * @property {User|null} user - Usuario autenticado
 * @property {boolean} loading - Estado de carga inicial
 * @property {boolean} isAuthenticated - Indica si hay sesión activa
 * @property {ThemeMode} theme - Tema seleccionado por el usuario ('light' | 'dark' | 'system')
 * @property {boolean} isDark - true si el tema efectivo actual es oscuro
 * @property {(mode: ThemeMode) => void} setTheme - Cambia el tema
 * @property {() => void} toggleTheme - Alterna entre light y dark
 */

const THEME_KEY = 'app-theme';

/** @type {import('react').Context<AppContextValue|null>} */
const AppContext = createContext(null);

/**
 * Determina si el sistema operativo prefiere el tema oscuro.
 * @returns {boolean}
 */
const systemPrefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

/**
 * Proveedor global de la aplicación.
 * Maneja:
 * - Estado de autenticación
 * - Sesión de usuario
 * - Suscripción a cambios de auth (login/logout)
 * - Tema de la interfaz (light / dark / system)
 *
 * @param {{ children: import('react').ReactNode }} props
 * @returns {JSX.Element}
 */
export const AppProvider = ({ children }) => {
  /** @type {[Session|null, Function]} */
  const [session, setSession] = useState(null);

  /** @type {[User|null, Function]} */
  const [user, setUser] = useState(null);

  /** @type {[boolean, Function]} */
  const [loading, setLoading] = useState(true);

  /**
   * Tema preferido por el usuario. Se persiste en localStorage.
   * @type {[ThemeMode, Function]}
   */
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  /**
   * Resuelve si el tema efectivo es oscuro,
   * teniendo en cuenta la preferencia 'system'.
   * @type {boolean}
   */
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark());

  // Aplica / quita la clase 'dark' en <html> cada vez que cambia el tema efectivo
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      console.log('is dark')
      root.classList.add('dark');
    } else {
      console.log('light')
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Escucha cambios en la preferencia del sistema cuando el tema es 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // Forzar re-render recalculando isDark
      setThemeState('system');
    };

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [theme]);

  /**
   * Cambia el tema y lo persiste en localStorage.
   * @type {(mode: ThemeMode) => void}
   */
  const setTheme = useCallback((mode) => {
    localStorage.setItem(THEME_KEY, mode);
    setThemeState(mode);
  }, []);

  /**
   * Alterna entre light y dark (ignora 'system').
   * @type {() => void}
   */
  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  // ── Autenticación ────────────────────────────────────────────────────────────

  useEffect(() => {
    /**
     * Obtiene la sesión inicial al montar la app.
     * @returns {Promise<void>}
     */
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    /** Listener de cambios de autenticación */
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /** @type {AppContextValue} */
  const value = {
    supabase,
    session,
    user,
    loading,
    isAuthenticated: !!session,
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Hook para consumir el contexto global de la app.
 *
 * @throws {Error} Si se usa fuera de AppProvider
 * @returns {AppContextValue}
 */
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
};
