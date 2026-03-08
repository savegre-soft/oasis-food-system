import { CheckCircle, Truck } from 'lucide-react';

// ── Group DELIVERED order_days by client ──────────────────────────────────────

const groupByClient = (orderDays) => {
  const clients = {};
  for (const od of orderDays) {
    const clientId   = od.orders?.clients?.id_client ?? od.orders?.clients?.name ?? '_';
    const clientName = od.orders?.clients?.name ?? '(sin nombre)';
    if (!clients[clientId]) clients[clientId] = { id: clientId, name: clientName, orderDays: [] };
    clients[clientId].orderDays.push({
      id_order_day:   od.id_order_day,
      classification: od.orders?.classification,
      recipes: (od.order_day_details ?? []).map((d) => ({
        name:     d.recipes?.name ?? '(sin nombre)',
        quantity: d.quantity ?? 1,
      })),
    });
  }
  return Object.values(clients).sort((a, b) => a.name.localeCompare(b.name));
};

// ── ClientDeliveredCard ───────────────────────────────────────────────────────

const ClassificationBadge = ({ classification }) => {
  if (classification === 'Lunch')  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">☀️ Almuerzo</span>;
  if (classification === 'Dinner') return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">🌙 Cena</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">👨‍👩‍👧 Familiar</span>;
};

const ClientDeliveredCard = ({ client }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 shrink-0">
        {client.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{client.name}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <CheckCircle size={11} className="text-green-500" />
          {client.orderDays.length} entregado{client.orderDays.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>

    <div className="divide-y divide-slate-50">
      {client.orderDays.map((od) => (
        <div key={od.id_order_day} className="flex items-center gap-2 px-5 py-3 flex-wrap">
          <CheckCircle size={13} className="text-green-400 shrink-0" />
          <ClassificationBadge classification={od.classification} />
          {(od.recipes ?? []).map((r, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {r.name}{r.quantity > 1 ? ` ×${r.quantity}` : ''}
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ── EntregaView ───────────────────────────────────────────────────────────────

const EntregaView = ({ orderDays }) => {
  const clients = groupByClient(orderDays ?? []);

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Truck size={36} className="mx-auto mb-3 opacity-30" />
        <p>Aún no hay entregas registradas hoy</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <CheckCircle size={14} className="text-green-500" />
        <span>{clients.length} cliente{clients.length !== 1 ? 's' : ''} entregado{clients.length !== 1 ? 's' : ''} hoy</span>
      </div>
      {clients.map((client) => (
        <ClientDeliveredCard key={client.id} client={client} />
      ))}
    </div>
  );
};

export default EntregaView;