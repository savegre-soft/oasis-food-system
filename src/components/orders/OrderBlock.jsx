import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { MACRO_UNIT } from '../orderUtils';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50 text-amber-700',
  },
  PACKED: {
    label: 'Empacado',
    icon: CheckCircle2,
    color: 'text-blue-500',
    bg: 'bg-blue-50 text-blue-700',
  },
  DELIVERED: {
    label: 'Entregado',
    icon: Truck,
    color: 'text-green-500',
    bg: 'bg-green-50 text-green-700',
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-50 text-red-600',
  },
};

const DAY_LABELS = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};

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
    <div className="border border-slate-100 rounded-xl overflow-hidden">
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
              {order.protein_snapshot} {MACRO_UNIT} prot · {order.carb_snapshot} {MACRO_UNIT} carb
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
                    <div className="ml-5 space-y-1">
                      {od.order_day_details.map((det, i) => {
                        const ovRows = det.order_day_recipe_overrides ?? [];
                        const hasOv = ovRows.length > 0;
                        const ingRows = hasOv ? ovRows : (det.recipes?.recipe_ingredients ?? []);
                        const bycat = { protein: [], carb: [], extra: [] };
                        ingRows.forEach((r) => {
                          if (bycat[r.category]) bycat[r.category].push(r.name);
                        });
                        const hasIngs = ['protein', 'carb', 'extra'].some(
                          (c) => bycat[c].length > 0
                        );
                        return (
                          <div key={i}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-medium text-slate-600">
                                {det.recipes?.name ?? 'Receta'}
                                {det.quantity > 1 ? ' ×' + det.quantity : ''}
                              </span>
                              {hasOv && (
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                  modificada
                                </span>
                              )}
                            </div>
                            {hasIngs && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {bycat.protein.map((n, j) => (
                                  <span
                                    key={'p' + j}
                                    className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full"
                                  >
                                    {n}
                                  </span>
                                ))}
                                {bycat.carb.map((n, j) => (
                                  <span
                                    key={'c' + j}
                                    className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full"
                                  >
                                    {n}
                                  </span>
                                ))}
                                {bycat.extra.map((n, j) => (
                                  <span
                                    key={'e' + j}
                                    className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full"
                                  >
                                    {n}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
