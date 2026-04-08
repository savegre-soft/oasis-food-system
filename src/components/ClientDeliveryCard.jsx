import { Truck } from 'lucide-react';

const ClientDeliveryCard = ({ client, onDeliver }) => {
  const allIds = client.orderDays.map((od) => od.id_order_day);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Client header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{client.name}</p>
            <p className="text-xs text-slate-400">
              {client.orderDays.length} comida{client.orderDays.length !== 1 ? 's' : ''} empacada
              {client.orderDays.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => allIds.forEach((id) => onDeliver(id))}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition shrink-0"
        >
          <Truck size={13} />
          Entregar todo
        </button>
      </div>

      {/* Order days list */}
      <div className="divide-y divide-slate-50">
        {client.orderDays.map((od) => (
          <div key={od.id_order_day} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  od.classification === 'Lunch'
                    ? 'bg-amber-50 text-amber-700'
                    : od.classification === 'Dinner'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-purple-50 text-purple-700'
                }`}
              >
                {od.classification === 'Lunch'
                  ? '☀️ Almuerzo'
                  : od.classification === 'Dinner'
                    ? '🌙 Cena'
                    : '👨‍👩‍👧 Familiar'}
              </span>

              {(od.recipes ?? []).map((r, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {r.name}
                  {r.quantity > 1 ? ` ×${r.quantity}` : ''}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onDeliver(od.id_order_day)}
              className="flex items-center gap-1.5 text-xs text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl transition shrink-0 ml-3"
            >
              <Truck size={12} />
              Entregar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientDeliveryCard;
