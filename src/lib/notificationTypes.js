import { CalendarHeart, Clock, CalendarClock, CalendarCheck, Link2, PencilLine } from 'lucide-react';

// Catálogo de tipos de notificación. Comparten metadata (ícono, color, label)
// entre la campana (NotificationBell), la sección dedicada (Notifications.jsx)
// y la configuración (Settings).
export const NOTIFICATION_TYPES = {
  quote_request: {
    label: 'Cotizaciones de eventos',
    description: 'Avisa cuando un cliente envía una cotización desde el sitio público.',
    Icon: CalendarHeart,
    color: 'text-oasis-olive-600 dark:text-oasis-olive-400',
    bg: 'bg-oasis-olive-50 dark:bg-oasis-olive-900/20',
  },
  payment_pending: {
    label: 'Pagos pendientes',
    description: 'Avisa cuando un pago lleva 4 días o más sin marcarse como pagado.',
    Icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  period_open: {
    label: 'Apertura de semana de pedidos',
    description: 'Avisa cada jueves cuando se abre la semana siguiente para gestionar pedidos.',
    Icon: CalendarClock,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
  },
  period_close: {
    label: 'Cierre de semana de pedidos',
    description: 'Avisa cada sábado cuando cierra la semana y queda listo el resumen de producción.',
    Icon: CalendarCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  portal_order_created: {
    label: 'Pedidos nuevos del portal',
    description: 'Avisa cuando un cliente confirma por primera vez su pedido desde su enlace del portal.',
    Icon: Link2,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  portal_order_updated: {
    label: 'Cambios en pedidos del portal',
    description: 'Avisa cuando un cliente modifica un pedido que ya había confirmado desde su enlace del portal.',
    Icon: PencilLine,
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
  },
};

export const DEFAULT_NOTIFICATION_TYPE = NOTIFICATION_TYPES.quote_request;
