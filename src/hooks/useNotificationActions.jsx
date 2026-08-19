import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../context/AppContext';
import ProductionPrintReport from '../components/ProductionPrintReport';

// Mismo select que Deliveries.jsx, generalizado a un rango de semana en vez
// de un solo delivery_date.
const ORDER_DAY_SELECT = `
  id_order_day,
  day_of_week,
  delivery_date,
  status,
  orders (
    id_order,
    classification,
    route_id,
    clients ( id_client, name, client_type )
  ),
  order_day_details (
    id_order_day_detail,
    status,
    quantity,
    protein_value_applied,
    carb_value_applied,
    meal_type,
    recipes (
      id_recipe, name,
      recipe_ingredients ( name, category )
    ),
    order_day_recipe_overrides ( name, category )
  )
`;

const fmtDate = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'long' });

const fmtWeekLabel = (start, end) =>
  `${fmtDate(start)} al ${new Date(end + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}`;

// Resuelve qué hacer al hacer clic en una notificación según su `type` —
// compartido entre NotificationBell.jsx (dropdown) y Notifications.jsx
// (sección dedicada) para no duplicar la lógica de navegación/reporte.
export default function useNotificationActions(markAsRead) {
  const nav = useNavigate();
  const { supabase } = useApp();

  const [weekOrderDays, setWeekOrderDays] = useState(null);
  const [weekLabel, setWeekLabel] = useState('');
  const [loadingWeek, setLoadingWeek] = useState(false);

  const handleSelect = async (n) => {
    markAsRead(n.id);

    if (n.type === 'payment_pending') {
      nav('/pagos?status=pending');
      return;
    }

    if (n.type === 'period_close') {
      const { week_start_date, week_end_date } = n.metadata ?? {};
      if (!week_start_date || !week_end_date) return;
      setLoadingWeek(true);
      const { data, error } = await supabase
        .schema('operations')
        .from('order_days')
        .select(ORDER_DAY_SELECT)
        .gte('delivery_date', week_start_date)
        .lte('delivery_date', week_end_date)
        .in('status', ['PENDING', 'PACKED', 'DELIVERED'])
        .order('id_order_day');
      if (error) console.error(error);
      setWeekLabel(fmtWeekLabel(week_start_date, week_end_date));
      setWeekOrderDays(data ?? []);
      setLoadingWeek(false);
      return;
    }

    // period_open: solo informativa, no navega a ningún lado.
  };

  const reportPortal =
    weekOrderDays &&
    createPortal(
      <ProductionPrintReport orderDays={weekOrderDays} weekLabel={weekLabel} onClose={() => setWeekOrderDays(null)} />,
      document.body
    );

  return { handleSelect, loadingWeek, reportPortal };
}
