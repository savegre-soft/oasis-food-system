import { ChefHat, Package, Truck } from 'lucide-react';
import CocinaView from './Kitchen';
import EmpaqueView from './Package';
import EntregaView from './Delivered';
import { DAY_LABELS } from './orderUtils';

// Pipeline de 3 etapas (Cocina → Empaque → Entrega) compartido por la página
// de Producción semanal y la de Express — antes esta misma barra + switch de
// vistas estaba escrita dos veces (una inline en Deliveries.jsx, otra dentro
// de ExpressView).
const STAGE_TABS = [
  { id: 'cocina', label: 'Cocina', Icon: ChefHat },
  { id: 'empaque', label: 'Empaque', Icon: Package },
  { id: 'entrega', label: 'Entrega', Icon: Truck },
];

const TabButton = ({ id, label, Icon, isActive, count, onSelect }) => {
  const cls =
    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition border ' +
    (isActive
      ? 'bg-slate-800 dark:bg-indigo-600 border-slate-800 dark:border-indigo-600 text-white shadow-sm'
      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600');

  const badgeCls =
    'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ' +
    (isActive
      ? 'bg-white dark:bg-slate-100 text-slate-800'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400');

  return (
    <button key={id} onClick={() => onSelect(id)} className={cls}>
      <Icon size={15} />
      {label}
      {count > 0 && <span className={badgeCls}>{count}</span>}
    </button>
  );
};

const KitchenPipeline = ({
  pendingDays,
  packedDays,
  deliveredDays,
  onPack,
  onPackDetail,
  onDeliver,
  onDeliverDetail,
  onUnpack,
  onUnpackDetail,
  activeTab,
  setActiveTab,
}) => {
  const counts = {
    cocina: pendingDays.length,
    empaque: pendingDays.length + packedDays.length,
    entrega: deliveredDays.length,
  };

  return (
    <>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {STAGE_TABS.map(({ id, label, Icon }) => (
          <TabButton
            key={id}
            id={id}
            label={label}
            Icon={Icon}
            isActive={activeTab === id}
            count={counts[id] ?? 0}
            onSelect={setActiveTab}
          />
        ))}
      </div>

      <div className="transition-opacity duration-300 dark:text-slate-300">
        {activeTab === 'cocina' && (
          <CocinaView orderDays={pendingDays} onPack={onPack} onPackDetail={onPackDetail} DAY_LABELS={DAY_LABELS} />
        )}
        {activeTab === 'empaque' && (
          <EmpaqueView
            pendingDays={pendingDays}
            packedDays={packedDays}
            onPack={onPack}
            onPackDetail={onPackDetail}
            onDeliver={onDeliver}
            onDeliverDetail={onDeliverDetail}
            onUnpack={onUnpack}
            onUnpackDetail={onUnpackDetail}
          />
        )}
        {activeTab === 'entrega' && <EntregaView orderDays={deliveredDays} onUndeliver={onPack} />}
      </div>
    </>
  );
};

export default KitchenPipeline;
