import { createContext, useContext } from "react";
import { supabase } from "../lib/supabase";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  return (
    <AppContext.Provider value={{ supabase }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
};