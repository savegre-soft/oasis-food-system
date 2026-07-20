import { useState, useMemo } from 'react';
import { ChefHat, Package, Truck, Archive, CheckCircle } from 'lucide-react';
import { COMBO_CATEGORY_LABEL, formatComboQuantity } from '../comboUtils';

const SUBTABS = [
  { id: 'cocina', label: 'Cocina', Icon: ChefHat },
  { id: 'empaque', label: 'Empaque', Icon: Package },
  { id: 'entrega', label: 'Entrega', Icon: Truck },
];

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
    <div className="shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

// Agrega las selecciones de un conjunto de pedidos por ítem de catálogo —
// usado por la vista "Por plato" (ej. "Arroz blanco: 3000 g").
const aggregateByItem = (orders) => {
  const grouped = {};
  for (const order of orders) {
    for (const sel of order.combo_order_selections ?? []) {
      const item = sel.combo_items;
      if (!item) continue;
      const key = sel.combo_item_id;
      if (!grouped[key]) {
        grouped[key] = {
          name: item.name,
          category: sel.category,
          portion_size_g: item.portion_size_g,
          count: 0,
        };
      }
      grouped[key].count += 1;
    }
  }
  return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
};

const PlatoView = ({ orders }) => {
  const aggregated = useMemo(() => aggregateByItem(orders), [orders]);

  if (aggregated.length === 0) {
    return (
      <div className="text-center py-14 text-slate-400 dark:text-slate-600">
        <Package size={32} className="mx-auto mb-2 opacity-30" />
        <p>Sin selecciones para agregar en esta etapa</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {aggregated.map((row) => (
        <div
          key={row.name + row.category}
          className="flex items-center justify-between bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{row.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {COMBO_CATEGORY_LABEL[row.category] ?? row.category}
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {formatComboQuantity(row.category, row.count, row.portion_size_g)}
          </p>
        </div>
      ))}
    </div>
  );
};

const ComboOrderCard = ({ order, actions }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 px-5 py-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0">
          {order.clients?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{order.clients?.name}</p>
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-auto">
        ₡{Number(order.price).toLocaleString('es-CR')}
      </span>
      {actions}
    </div>
    {(order.combo_order_selections ?? []).length > 0 && (
      <div className="flex gap-1.5 flex-wrap mt-2 ml-10">
        {order.combo_order_selections.map((s) => (
          <span
            key={s.id_combo_order_selection}
            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg"
          >
            {s.combo_items?.name}
          </span>
        ))}
      </div>
    )}
  </div>
);

const ClienteView = ({ stage, pending, packed, delivered, onPack, onDeliver, onUnpack, onUndeliver }) => {
  if (stage === 'cocina') {
    if (pending.length === 0)
      return (
        <div className="text-center py-14 text-slate-400 dark:text-slate-600">
          <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
          <p>No hay pedidos de combo pendientes</p>
        </div>
      );
    return (
      <div className="space-y-3">
        {pending.map((o) => (
          <ComboOrderCard
            key={o.id_combo_order}
            order={o}
            actions={
              <button
                onClick={() => onPack(o.id_combo_order)}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-slate-800 dark:bg-indigo-600 hover:bg-slate-700 dark:hover:bg-indigo-500 px-3 py-1.5 rounded-xl transition"
              >
                <Archive size={12} /> Marcar empacado
              </button>
            }
          />
        ))}
      </div>
    );
  }

  if (stage === 'empaque') {
    if (pending.length === 0 && packed.length === 0)
      return (
        <div className="text-center py-14 text-slate-400 dark:text-slate-600">
          <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
          <p>No hay pedidos de combo para empacar</p>
        </div>
      );
    return (
      <div className="space-y-3">
        {pending.map((o) => (
          <ComboOrderCard
            key={o.id_combo_order}
            order={o}
            actions={
              <button
                onClick={() => onPack(o.id_combo_order)}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-slate-800 dark:bg-indigo-600 hover:bg-slate-700 dark:hover:bg-indigo-500 px-3 py-1.5 rounded-xl transition"
              >
                <Archive size={12} /> Empacar
              </button>
            }
          />
        ))}
        {packed.map((o) => (
          <ComboOrderCard
            key={o.id_combo_order}
            order={o}
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUnpack(o.id_combo_order)}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition"
                >
                  <Archive size={12} /> Desempacar
                </button>
                <button
                  onClick={() => onDeliver(o.id_combo_order)}
                  className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 px-3 py-1.5 rounded-xl transition"
                >
                  <Truck size={12} /> Entregar
                </button>
              </div>
            }
          />
        ))}
      </div>
    );
  }

  // entrega
  if (delivered.length === 0)
    return (
      <div className="text-center py-14 text-slate-400 dark:text-slate-600">
        <Truck size={32} className="mx-auto mb-2 opacity-30" />
        <p>Aún no hay combos entregados</p>
      </div>
    );
  return (
    <div className="space-y-3">
      {delivered.map((o) => (
        <ComboOrderCard
          key={o.id_combo_order}
          order={o}
          actions={
            <button
              onClick={() => onUndeliver(o.id_combo_order)}
              className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition"
            >
              <Archive size={12} /> Devolver a empaque
            </button>
          }
        />
      ))}
    </div>
  );
};

// orders: combo_orders de la semana/rango activo, con clients() y
// combo_order_selections(combo_items()) — misma forma que ComboOrdersTab.
const ComboDeliveryView = ({ orders, onPack, onDeliver, onUnpack, onUndeliver }) => {
  const [stage, setStage] = useState('cocina');
  const [viewMode, setViewMode] = useState('cliente');

  const pending = useMemo(() => orders.filter((o) => o.status === 'PENDING'), [orders]);
  const packed = useMemo(() => orders.filter((o) => o.status === 'PACKED'), [orders]);
  const delivered = useMemo(() => orders.filter((o) => o.status === 'DELIVERED'), [orders]);

  const counts = {
    cocina: pending.length,
    empaque: pending.length + packed.length,
    entrega: delivered.length,
  };

  const stageOrders = stage === 'cocina' ? pending : stage === 'empaque' ? [...pending, ...packed] : delivered;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<ChefHat className="text-amber-500" size={20} />} label="Pendientes" value={pending.length} />
        <StatCard icon={<Package className="text-blue-500" size={20} />} label="Empacados" value={packed.length} />
        <StatCard icon={<Truck className="text-green-500" size={20} />} label="Entregados" value={delivered.length} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {SUBTABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setStage(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border ${
                stage === id
                  ? 'bg-slate-800 dark:bg-indigo-600 border-slate-800 dark:border-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <Icon size={15} />
              {label}
              {counts[id] > 0 && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    stage === id
                      ? 'bg-white dark:bg-slate-100 text-slate-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            ['cliente', 'Por cliente'],
            ['plato', 'Por plato'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setViewMode(val)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === val
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'plato' ? (
        <PlatoView orders={stageOrders} />
      ) : (
        <ClienteView
          stage={stage}
          pending={pending}
          packed={packed}
          delivered={delivered}
          onPack={onPack}
          onDeliver={onDeliver}
          onUnpack={onUnpack}
          onUndeliver={onUndeliver}
        />
      )}
    </div>
  );
};

export default ComboDeliveryView;
