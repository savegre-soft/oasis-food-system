import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Pencil, X } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_ORDER  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_LABELS = { Monday:'Lunes', Tuesday:'Martes', Wednesday:'Miércoles', Thursday:'Jueves', Friday:'Viernes', Saturday:'Sábado', Sunday:'Domingo' };
const DAY_SHORT  = { Monday:'Lun', Tuesday:'Mar', Wednesday:'Mié', Thursday:'Jue', Friday:'Vie', Saturday:'Sáb', Sunday:'Dom' };

const STATUS_STYLES = {
  PENDING:   { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200'  },
  PACKED:    { label: 'Empacado',  cls: 'bg-blue-50 text-blue-700 border-blue-200'     },
  DELIVERED: { label: 'Entregado', cls: 'bg-green-50 text-green-700 border-green-200'  },
  CANCELLED: { label: 'Cancelado', cls: 'bg-red-50 text-red-600 border-red-200'        },
};

const fmtDate = (str, opts) =>
  new Date(str + 'T00:00:00').toLocaleDateString('es-CR', opts);

// ── OrderDetailModal ──────────────────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose, onEdit }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!order) return null;

  const isFamilyClient = order.clients?.client_type === 'family';
  const st = STATUS_STYLES[order.status] ?? { label: order.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };

  const dayMap = {};
  (order.order_days ?? []).forEach((od) => {
    if (!dayMap[od.day_of_week]) dayMap[od.day_of_week] = { ...od, details: [] };
    (od.order_day_details ?? []).forEach((det) => dayMap[od.day_of_week].details.push(det));
  });
  const orderedDays  = DAY_ORDER.filter((d) => dayMap[d]);
  const deliveryDays = order.routes?.route_delivery_days ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-800 text-lg">{order.clients?.name}</p>
            <span className={'text-xs font-medium px-2.5 py-0.5 rounded-full border ' + st.cls}>{st.label}</span>
            <span className={'text-xs font-medium px-2.5 py-0.5 rounded-full ' + (isFamilyClient ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700')}>
              {isFamilyClient
                ? <><Users size={10} className="inline mr-1" />Familiar</>
                : <><User  size={10} className="inline mr-1" />Personal</>}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {onEdit && (
              <button onClick={() => onEdit(order)}
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 text-white px-3 py-1.5 rounded-xl hover:bg-slate-700 transition">
                <Pencil size={12} /> Editar
              </button>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Semana</p>
            <p className="text-sm text-slate-700">
              {fmtDate(order.week_start_date, { day: '2-digit', month: 'long' })}
              {' — '}
              {fmtDate(order.week_end_date, { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Menu</p>
            <p className="text-sm text-slate-700">
              {isFamilyClient              ? 'Familiar'
                : order.classification === 'both'   ? 'Almuerzo + Cena'
                : order.classification === 'Lunch'  ? 'Almuerzo'
                : order.classification === 'Dinner' ? 'Cena'
                : order.classification}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Ruta</p>
            {order.routes ? (
              <>
                <p className="text-sm font-medium text-slate-800">{order.routes.name}</p>
                {deliveryDays.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {deliveryDays.map((d, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {DAY_LABELS[d.day_of_week] ?? d.day_of_week}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Sin ruta asignada</p>
            )}
          </div>

          {!isFamilyClient && order.protein_snapshot && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Macros globales</p>
              <p className="text-sm text-slate-700">
                {order.classification === 'Dinner' ? '🌙 ' : '☀️ '}
                {order.protein_snapshot}{order.protein_unit_snapshot} prot
                {' · '}
                {order.carb_snapshot}{order.carb_unit_snapshot} carbos
              </p>
            </div>
          )}

          {orderedDays.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Dias con recetas</p>
              <div className="space-y-2">
                {orderedDays.map((day) => {
                  const od      = dayMap[day];
                  const details = od.details ?? [];
                  const daySt   = STATUS_STYLES[od.status] ?? { label: od.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
                  return (
                    <div key={day} className="flex items-start gap-2">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium min-w-[48px] text-center shrink-0 mt-0.5">
                        {DAY_SHORT[day]}
                      </span>
                      <div className="flex-1 min-w-0">
                        {details.length > 0 ? (
                          <div className="space-y-0.5">
                            {details.map((det, i) => (
                              <p key={i} className="text-xs text-slate-600">
                                {det.recipes?.name ?? 'Receta'}
                                {det.quantity > 1 && <span className="text-slate-400"> x{det.quantity}</span>}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Sin recetas</p>
                        )}
                        {od.delivery_date && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {'Entrega: '}
                            {fmtDate(od.delivery_date, { day: '2-digit', month: 'short' })}
                            <span className={'ml-2 px-1.5 py-0.5 rounded-full border text-[10px] ' + daySt.cls}>{daySt.label}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailModal;
