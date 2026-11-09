import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'oasis_notification_prefs';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { mutedTypes: Array.isArray(parsed?.mutedTypes) ? parsed.mutedTypes : [] };
  } catch {
    return { mutedTypes: [] };
  }
}

// Store a nivel de módulo (no de componente): NotificationBell.jsx y
// NotificationSettings.jsx montan esta hook por separado, y sin un estado
// compartido el cambio de uno no se reflejaba en el otro hasta recargar la
// página. useSyncExternalStore mantiene ambas instancias sincronizadas.
let state = loadPrefs();
const listeners = new Set();

function setState(updater) {
  state = updater(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Modo privado, cuota excedida, etc. — la preferencia solo dura la sesión.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

// Preferencias de notificaciones por navegador (localStorage), no por
// usuario: no hay tabla de preferencias en Supabase todavía.
export default function useNotificationPrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot);

  const isMuted = useCallback((type) => prefs.mutedTypes.includes(type), [prefs.mutedTypes]);

  const toggleType = useCallback((type) => {
    setState((prev) => {
      const muted = prev.mutedTypes.includes(type);
      return {
        mutedTypes: muted ? prev.mutedTypes.filter((t) => t !== type) : [...prev.mutedTypes, type],
      };
    });
  }, []);

  return { mutedTypes: prefs.mutedTypes, isMuted, toggleType };
}
