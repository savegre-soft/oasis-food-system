import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  return (
    <AppContext.Provider
      value={{
        supabase,
        session,
        user,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
};
