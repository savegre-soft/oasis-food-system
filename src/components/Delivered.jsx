import { useState, useMemo } from 'react';
import { CheckCircle, Truck, Archive } from 'lucide-react';

// ── Group DELIVERED order_days by client ──────────────────────────────────────

const groupByClient = (orderDays) => {
  const clients = {};
  for (const od of orderDays) {
    const clientId = od.orders?.clients?.id_client ?? od.orders?.clients?.name ?? '_';
    const clientName = od.orders?.clients?.name ?? '(sin nombre)';
    if (!clients[clientId]) clients[clientId] = { id: clientId, name: clientName, orderDays: [] };
    clients[clientId].orderDays.push({
      id_order_day: od.id_order_day,
      id_order: od.orders?.id_order,
      classification: od.orders?.classification,
      recipes: (od.order_day_details ?? []).map((d) => ({
        name: d.recipes?.name ?? '(sin nombre)',
        quantity: d.quantity ?? 1,
      })),
    });
  }
  return Object.values(clients).sort((a, b) => a.name.localeCompare(b.name));
};

// ── Classification badge ──────────────────────────────────────────────────────

const ClassificationBadge = ({ classification }) => {
  if (classification === 'Lunch')
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        ☀️ Almuerzo
      </span>
    );
  if (classification === 'Dinner')
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
        🌙 Cena
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
      👨‍👩‍👧 Familiar
    </span>
  );
};

// ── ClientDeliveredCard ───────────────────────────────────────────────────────

const ClientDeliveredCard = ({ client, onUndeliver, selectedIds, onToggleId }) => {
  const orderGroups = useMemo(() => {
    const groups = {};
    for (const od of client.orderDays) {
      const key = od.id_order ?? '_';
      if (!groups[key]) groups[key] = { id_order: od.id_order, ods: [] };
      groups[key].ods.push(od);
    }
    return Object.values(groups);
  }, [client.orderDays]);

  const hasMultipleOrders = orderGroups.length > 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Client header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50 dark:border-slate-800/50">
        <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-bold text-green-700 dark:text-green-400 shrink-0">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{client.name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <CheckCircle size={11} className="text-green-500 dark:text-green-400" />
            {client.orderDays.length} entregado{client.orderDays.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onUndeliver && (
          <button
            type="button"
            onClick={() => client.orderDays.forEach((od) => onUndeliver(od.id_order_day))}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition shrink-0"
          >
            <Archive size={12} />
            Devolver todo
          </button>
        )}
      </div>

      {/* Order groups */}
      <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
        {orderGroups.map((group) => (
          <div key={group.id_order ?? '_'}>
            {/* Per-order sub-header when client has multiple orders */}
            {hasMultipleOrders && (
              <div className="flex items-center justify-between px-5 py-2 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  Orden #{group.id_order}
                </span>
                {onUndeliver && (
                  <button
                    type="button"
                    onClick={() => group.ods.forEach((od) => onUndeliver(od.id_order_day))}
                    className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  >
                    <Archive size={11} />
                    Devolver esta orden
                  </button>
                )}
              </div>
            )}

            {/* Individual order-day rows */}
            {group.ods.map((od) => (
              <div
                key={od.id_order_day}
                className="flex items-center justify-between gap-2 px-5 py-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(od.id_order_day) ?? false}
                    onChange={() => onToggleId?.(od.id_order_day)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-400 cursor-pointer shrink-0"
                  />
                  <CheckCircle size={13} className="text-green-400 dark:text-green-500 shrink-0" />
                  <ClassificationBadge classification={od.classification} />
                  {!hasMultipleOrders && od.id_order && (
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      #{od.id_order}
                    </span>
                  )}
                  {(od.recipes ?? []).map((r, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full"
                    >
                      {r.name}
                      {r.quantity > 1 ? ` ×${r.quantity}` : ''}
                    </span>
                  ))}
                </div>
                {onUndeliver && (
                  <button
                    type="button"
                    onClick={() => onUndeliver(od.id_order_day)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition shrink-0 ml-3"
                  >
                    <Archive size={12} />
                    Devolver a empaque
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── EntregaView ───────────────────────────────────────────────────────────────

const EntregaView = ({ orderDays, onUndeliver }) => {
  const clients = groupByClient(orderDays ?? []);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const allIds = useMemo(() => (orderDays ?? []).map((od) => od.id_order_day), [orderDays]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && allIds.some((id) => selectedIds.has(id));

  const toggleId = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(allIds));
  const clearSelection = () => setSelectedIds(new Set());

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-600">
        <Truck size={36} className="mx-auto mb-3 opacity-30" />
        <p>Aún no hay entregas registradas hoy</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-800 dark:bg-slate-700 text-white rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-sm font-medium flex-1">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={() => {
              [...selectedIds].forEach((id) => onUndeliver?.(id));
              clearSelection();
            }}
            className="flex items-center gap-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition"
          >
            <Archive size={13} />
            Devolver a empaque
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-white/60 hover:text-white transition text-lg leading-none px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary row with select-all */}
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected; }}
          onChange={toggleAll}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-400 cursor-pointer"
        />
        <CheckCircle size={14} className="text-green-500 dark:text-green-400" />
        <span>
          {clients.length} cliente{clients.length !== 1 ? 's' : ''} entregado
          {clients.length !== 1 ? 's' : ''} hoy
        </span>
      </div>

      {clients.map((client) => (
        <ClientDeliveredCard
          key={client.id}
          client={client}
          onUndeliver={onUndeliver}
          selectedIds={selectedIds}
          onToggleId={toggleId}
        />
      ))}
    </div>
  );
};

export default EntregaView;
