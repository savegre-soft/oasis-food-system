import { useState } from 'react';

// Icons
import { ChevronUp, ChevronDown } from 'lucide-react';

// Constants
import { STATUS_CONFIG, DAY_LABELS } from '../../utils/customerUtils';


// Single order card — shows classification, route, days with recipes
const OrderBlock = ({ order }) => {
  const [open, setOpen] = useState(false);

  const classLabel =
    order.classification === 'Lunch'
      ? '☀️ Almuerzo'
      : order.classification === 'Dinner'
        ? '🌙 Cena'
        : '👨‍👩‍👧 Familiar';

  const classBg =
    order.classification === 'Lunch'
      ? 'bg-amber-50 text-amber-700'
      : order.classification === 'Dinner'
        ? 'bg-indigo-50 text-indigo-700'
        : 'bg-purple-50 text-purple-700';

  const days = (order.order_days ?? []).sort(
    (a, b) => new Date(a.delivery_date) - new Date(b.delivery_date)
  );

  return (
    <div className=" rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={'text-xs font-medium px-2.5 py-0.5 rounded-full ' + classBg}>
            {classLabel}
          </span>
          {order.routes && <span className="text-xs text-slate-500">📍 {order.routes.name}</span>}
          {order.protein_snapshot && (
            <span className="text-xs text-slate-400">
              {order.protein_snapshot}
              {order.protein_unit_snapshot} prot · {order.carb_snapshot}
              {order.carb_unit_snapshot} carb
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={15} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-slate-400 shrink-0" />
        )}
      </button>

      {/* Days */}
      {open && (
        <div className="divide-y divide-slate-50">
          {days.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400 italic">Sin días registrados</p>
          ) : (
            days.map((od) => {
              const st = STATUS_CONFIG[od.status] ?? STATUS_CONFIG.PENDING;
              const Icon = st.icon;
              return (
                <div key={od.id_order_day} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className={st.color} />
                      <span className="text-sm font-medium text-slate-700">
                        {DAY_LABELS[od.day_of_week] ?? od.day_of_week}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(od.delivery_date + 'T00:00:00').toLocaleDateString('es-CR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + st.bg}>
                      {st.label}
                    </span>
                  </div>
                  {(od.order_day_details ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-5">
                      {od.order_day_details.map((det, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                        >
                          {det.recipes?.name ?? 'Receta'}
                          {det.quantity > 1 ? ' ×' + det.quantity : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default OrderBlock;