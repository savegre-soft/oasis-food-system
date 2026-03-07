import { Package, CheckCircle } from 'lucide-react';
import ClientPackingCard from './ClientPackingCard';

// Agrupa orderDays (PENDING) por cliente
const groupByClient = (orderDays) => {
  const clients = {};

  for (const od of orderDays) {
    const clientName = od.orders?.clients?.name ?? '(sin nombre)';
    const clientId   = od.orders?.clients?.id_client ?? clientName;

    if (!clients[clientId]) {
      clients[clientId] = { id: clientId, name: clientName, orderDays: [] };
    }

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

const EmpaqueView = ({ orderDays, onPack }) => {
  const clients = groupByClient(orderDays);

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <CheckCircle size={36} className="mx-auto mb-3 opacity-30" />
        <p>No hay pedidos pendientes de empacar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Package size={15} className="text-orange-400" />
        <span>{clients.length} cliente{clients.length !== 1 ? 's' : ''} pendiente{clients.length !== 1 ? 's' : ''} de empacar</span>
      </div>
      {clients.map((client) => (
        <ClientPackingCard key={client.id} client={client} onPack={onPack} />
      ))}
    </div>
  );
};

export default EmpaqueView;