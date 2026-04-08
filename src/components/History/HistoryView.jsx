
import { useState } from "react";
import { ChevronDown, ChevronUp, Clock} from 'lucide-react';
import OrderBlock from "../orders/OrderBlock";

const formatWeek = (start, end) => {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end   + 'T00:00:00');
  const opts = { day: '2-digit', month: 'short' };
  return s.toLocaleDateString('es-CR', opts) + ' — ' + e.toLocaleDateString('es-CR', { ...opts, year: 'numeric' });
};


// History view — grouped by week
const HistoryView = ({ orders }) => {
  const [openWeeks, setOpenWeeks] = useState({});

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Clock size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">Sin historial de órdenes</p>
      </div>
    );
  }

  // Group by week_start_date
  const grouped = {};
  orders.forEach((o) => {
    const key = o.week_start_date + '_' + o.week_end_date;
    if (!grouped[key]) grouped[key] = { start: o.week_start_date, end: o.week_end_date, orders: [] };
    grouped[key].orders.push(o);
  });

  const weeks = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  const toggleWeek = (key) => setOpenWeeks(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-3">
      {weeks.map(([key, { start, end, orders: weekOrders }]) => {
        const isOpen = openWeeks[key] ?? false;
        return (
          <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleWeek(key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">{formatWeek(start, end)}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {weekOrders.length} orden{weekOrders.length !== 1 ? 'es' : ''}
                </span>
              </div>
              {isOpen
                ? <ChevronUp size={15} className="text-slate-400" />
                : <ChevronDown size={15} className="text-slate-400" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-2 space-y-3 bg-slate-50">
                {weekOrders.map((order) => (
                  <OrderBlock key={order.id_order} order={order} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};




export default HistoryView