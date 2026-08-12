import { ChefHat, Package, Truck } from 'lucide-react';

// RF-DASH-01 — conteo en tiempo real de platos pendientes/empacados/entregados
// del lote de producción activo. Cuenta a nivel de order_day_details (platos
// reales, por quantity), no de order_days, porque el empaque/entrega puede
// hacerse de forma parcial por receta dentro de un mismo día de pedido.
const sumPlatos = (days, status) =>
  days
    .flatMap((d) => d.order_day_details ?? [])
    .filter((detail) => detail.status === status)
    .reduce((sum, detail) => sum + (detail.quantity || 0), 0);

const StatCard = ({ icon, label, value, colorClass }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4">
    <div className={`p-2.5 rounded-lg ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);

const ProductionStatusPanel = ({ pendingDays, packedDays, deliveredDays }) => {
  const allDays = [...pendingDays, ...packedDays, ...deliveredDays];

  const pendingCount = sumPlatos(allDays, 'PENDING');
  const packedCount = sumPlatos(allDays, 'PACKED');
  const deliveredCount = sumPlatos(allDays, 'DELIVERED');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <StatCard
        icon={<ChefHat size={18} />}
        label="Platos por cocinar"
        value={pendingCount}
        colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        icon={<Package size={18} />}
        label="Platos empacados"
        value={packedCount}
        colorClass="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
      />
      <StatCard
        icon={<Truck size={18} />}
        label="Platos entregados"
        value={deliveredCount}
        colorClass="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
      />
    </div>
  );
};

export default ProductionStatusPanel;
