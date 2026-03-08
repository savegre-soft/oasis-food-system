import { Truck, CheckCircle } from 'lucide-react';
import ClientDeliveryCard from './ClientDeliveryCard';

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

const EntregaView = ({ orderDays, onDeliver }) => {
  const clients = groupByClient(orderDays);

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <CheckCircle size={36} className="mx-auto mb-3 opacity-30" />
        <p>No hay pedidos empacados listos para entregar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Truck size={15} className="text-green-500" />
        <span>{clients.length} cliente{clients.length !== 1 ? 's' : ''} listo{clients.length !== 1 ? 's' : ''} para entregar</span>
      </div>
      {clients.map((client) => (
        <ClientDeliveryCard key={client.id} client={client} onDeliver={onDeliver} />
      ))}
    </div>
  );
};

export default EntregaView;