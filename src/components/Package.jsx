import { Truck, Archive, AlertTriangle, CheckCircle } from 'lucide-react';

// ── Group order_days by client ────────────────────────────────────────────────

const groupByClient = (orderDays) => {
  const clients = {};
  for (const od of orderDays) {
    const clientId   = od.orders?.clients?.id_client ?? od.orders?.clients?.name ?? '_';
    const clientName = od.orders?.clients?.name ?? '(sin nombre)';
    if (!clients[clientId]) clients[clientId] = { id: clientId, name: clientName, orderDays: [] };
    clients[clientId].orderDays.push({
      id_order_day:   od.id_order_day,
      status:         od.status,
      classification: od.orders?.classification,
      recipes: (od.order_day_details ?? []).map((d) => ({
        name:     d.recipes?.name ?? '(sin nombre)',
        quantity: d.quantity ?? 1,
      })),
    });
  }
  return clients;
};

// ── ClientEmpaqueCard ─────────────────────────────────────────────────────────

const ClassificationBadge = ({ classification }) => {
  if (classification === 'Lunch')  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">☀️ Almuerzo</span>;
  if (classification === 'Dinner') return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">🌙 Cena</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">👨‍👩‍👧 Familiar</span>;
};

const ClientEmpaqueCard = ({ client, onDeliver }) => {
  const packed  = client.orderDays.filter((od) => od.status === 'PACKED');
  const pending = client.orderDays.filter((od) => od.status === 'PENDING');
  const allPackedIds = packed.map((od) => od.id_order_day);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{client.name}</p>
            <p className="text-xs text-slate-400">
              {packed.length} empacado{packed.length !== 1 ? 's' : ''}
              {pending.length > 0 && <span className="text-amber-600 ml-1">· {pending.length} sin empacar</span>}
            </p>
          </div>
        </div>

        {packed.length > 0 && (
          <button
            type="button"
            onClick={() => allPackedIds.forEach((id) => onDeliver(id))}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition shrink-0"
          >
            <Truck size={13} />
            Entregar todo
          </button>
        )}
      </div>

      {/* Aviso si tiene pendientes sin empacar */}
      {pending.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-b border-amber-100">
          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            {pending.length} comida{pending.length !== 1 ? 's' : ''} aún sin empacar
          </p>
        </div>
      )}

      {/* Packed items — with Deliver action */}
      {packed.length > 0 && (
        <div className="divide-y divide-slate-50">
          {packed.map((od) => (
            <div key={od.id_order_day} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <ClassificationBadge classification={od.classification} />
                {(od.recipes ?? []).map((r, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {r.name}{r.quantity > 1 ? ` ×${r.quantity}` : ''}
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
      )}

      {/* Pending items — informational only */}
      {pending.length > 0 && (
        <div className="divide-y divide-slate-50">
          {pending.map((od) => (
            <div key={od.id_order_day} className="flex items-center gap-2 px-5 py-3 opacity-50">
              <Archive size={12} className="text-slate-400 shrink-0" />
              <ClassificationBadge classification={od.classification} />
              {(od.recipes ?? []).map((r, i) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {r.name}{r.quantity > 1 ? ` ×${r.quantity}` : ''}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

// ── EmpaqueView ───────────────────────────────────────────────────────────────

const EmpaqueView = ({ pendingDays, packedDays, onDeliver }) => {
  // Merge both sets keyed by client
  const allDays = [...(pendingDays ?? []), ...(packedDays ?? [])];
  const byClient = groupByClient(allDays);
  const clients  = Object.values(byClient).sort((a, b) => a.name.localeCompare(b.name));

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <CheckCircle size={36} className="mx-auto mb-3 opacity-30" />
        <p>No hay pedidos activos para empacar</p>
      </div>
    );
  }

  const packedCount  = clients.reduce((s, c) => s + c.orderDays.filter((od) => od.status === 'PACKED').length,  0);
  const pendingCount = clients.reduce((s, c) => s + c.orderDays.filter((od) => od.status === 'PENDING').length, 0);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
        {packedCount  > 0 && <span className="flex items-center gap-1.5"><Truck   size={14} className="text-green-500"  /> {packedCount}  empacado{packedCount  !== 1 ? 's' : ''}</span>}
        {pendingCount > 0 && <span className="flex items-center gap-1.5"><Archive size={14} className="text-amber-400"  /> {pendingCount} sin empacar</span>}
      </div>

      {clients.map((client) => (
        <ClientEmpaqueCard key={client.id} client={client} onDeliver={onDeliver} />
      ))}
    </div>
  );
};

export default EmpaqueView;