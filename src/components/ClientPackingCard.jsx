import { Archive, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const ClientPackingCard = ({ client, onPack }) => {
  const allIds = client.orderDays.map((od) => od.id_order_day);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Client header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{client.name}</p>
            <p className="text-xs text-slate-400">{client.orderDays.length} comida{client.orderDays.length !== 1 ? 's' : ''} pendiente{client.orderDays.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => allIds.forEach((id) => onPack(id))}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl transition shrink-0"
        >
          <Archive size={13} />
          Empacar todo
        </button>
      </div>

      {/* Order days list */}
      <div className="divide-y divide-slate-50">
        {client.orderDays.map((od) => (
          <div key={od.id_order_day} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                od.classification === 'Lunch'
                  ? 'bg-amber-50 text-amber-700'
                  : od.classification === 'Dinner'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-purple-50 text-purple-700'
              }`}>
                {od.classification === 'Lunch' ? '☀️ Almuerzo' : od.classification === 'Dinner' ? '🌙 Cena' : '👨‍👩‍👧 Familiar'}
              </span>

              {/* Recipe summary */}
              <div className="flex flex-wrap gap-1">
                {(od.recipes ?? []).map((r, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {r.name}{r.quantity > 1 ? ` ×${r.quantity}` : ''}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onPack(od.id_order_day)}
              className="flex items-center gap-1.5 text-xs text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition shrink-0 ml-3"
            >
              <Archive size={12} />
              Empacar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientPackingCard;