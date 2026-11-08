import { useNavigate } from 'react-router-dom';

// Resuelve qué hacer al hacer clic en una notificación según su `type` —
// compartido entre NotificationBell.jsx (dropdown) y Notifications.jsx
// (sección dedicada). Portado de Fase_2 y recortado a los tipos que esta
// rama produce ('quote_request'); Fase_2 agrega ahí mismo payment_pending/
// period_open/period_close, que no pertenecen a este feature.
export default function useNotificationActions(markAsRead) {
  const nav = useNavigate();

  const handleSelect = (n) => {
    markAsRead(n.id);

    if (n.type === 'quote_request') {
      nav('/cotizaciones');
    }
  };

  return { handleSelect };
}
