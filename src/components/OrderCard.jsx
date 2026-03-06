const STATUS_STYLES = {
  PENDING:   { label: 'Pendiente', className: 'bg-yellow-50 text-yellow-700' },
  DELIVERED: { label: 'Entregado', className: 'bg-green-50 text-green-700' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
};

const DAY_LABELS = {
  Monday: 'Lun', Tuesday: 'Mar', Wednesday: 'Mié',
  Thursday: 'Jue', Friday: 'Vie', Saturday: 'Sáb', Sunday: 'Dom',
};

const OrderCard = ({ order }) => {
  const st = STATUS_STYLES[order.status] ?? { label: order.status, className: 'bg-slate-100 text-slate-600' };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">

          {/* Cliente + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800">{order.clients?.name}</p>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${st.className}`}>
              {st.label}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {order.classification === 'Lunch'
                ? '☀️ Almuerzo'
                : order.classification === 'Dinner'
                ? '🌙 Cena'
                : order.classification}
            </span>
          </div>

          {/* Semana y ruta */}
          <p className="text-sm text-slate-500">
            Semana: {new Date(order.week_start_date).toLocaleDateString('es-CR')} — {new Date(order.week_end_date).toLocaleDateString('es-CR')}
            {order.routes && (
              <span className="ml-3">· Ruta: {order.routes.name}</span>
            )}
          </p>

          {/* Macros snapshot */}
          {order.protein_snapshot && (
            <p className="text-xs text-slate-400">
              Proteína: {order.protein_snapshot}{order.protein_unit_snapshot} · Carbos: {order.carb_snapshot}{order.carb_unit_snapshot}
            </p>
          )}

          {/* Días de entrega */}
          {order.order_days?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-1">
              {order.order_days.map((d) => (
                <span
                  key={d.id_order_day}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    d.status === 'DELIVERED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {DAY_LABELS[d.day_of_week]}{' '}
                  {new Date(d.delivery_date).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit' })}
                </span>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OrderCard;