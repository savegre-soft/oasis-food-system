import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * @typedef {import('@supabase/supabase-js').Session} Session
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').SupabaseClient} SupabaseClient
 */

/**
 * @typedef {Object} AppContextValue
 * @property {SupabaseClient} supabase - Instancia de Supabase
 * @property {Session|null} session - Sesión actual
 * @property {User|null} user - Usuario autenticado
 * @property {boolean} loading - Estado de carga inicial
 * @property {boolean} isAuthenticated - Indica si hay sesión activa
 */

/** @type {import('react').Context<AppContextValue|null>} */
const AppContext = createContext(null);

/**
 * Proveedor global de la aplicación.
 * Maneja:
 * - Estado de autenticación
 * - Sesión de usuario
 * - Suscripción a cambios de auth (login/logout)
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

  useEffect(() => {
    /**
     * Obtiene la sesión inicial al montar la app
     * @returns {Promise<void>}
     */
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);
      setUser(data.session?.user ?? null);

      setLoading(false);
    };

    getSession();

    /**
     * Listener de cambios de autenticación
     */
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

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