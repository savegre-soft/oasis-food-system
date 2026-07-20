import { COMBO_CATEGORY_LABEL, COMBO_ORDER_STATUS_LABEL, isGramCategory } from '../comboUtils';

const STATUS_CLS = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PACKED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

// Tarjeta de un pedido de combo — compartida entre la pestaña Semana
// (ComboOrdersTab) y la pestaña Histórico (ComboHistoryView).
const ComboOrderCard = ({ order }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{order.clients?.name}</p>
      <span className={'text-xs font-medium px-2.5 py-0.5 rounded-full border ' + (STATUS_CLS[order.status] ?? '')}>
        {COMBO_ORDER_STATUS_LABEL[order.status] ?? order.status}
      </span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-auto">
        ₡{Number(order.price).toLocaleString('es-CR')}
      </span>
    </div>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Entrega: {order.delivery_date}</p>
    {(order.combo_order_selections ?? []).length > 0 && (
      <div className="flex gap-1.5 flex-wrap mt-2">
        {order.combo_order_selections.map((s) => (
          <span
            key={s.id_combo_order_selection}
            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg"
          >
            {COMBO_CATEGORY_LABEL[s.category]}: {s.combo_items?.name}
            {isGramCategory(s.category) && ` (${s.combo_items?.portion_size_g} g)`}
          </span>
        ))}
      </div>
    )}
  </div>
);

export default ComboOrderCard;
