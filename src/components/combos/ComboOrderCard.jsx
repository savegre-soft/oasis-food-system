import { Pencil, Trash2 } from 'lucide-react';
import {
  COMBO_CATEGORY_LABEL,
  COMBO_ORDER_STATUS_LABEL,
  isGramCategory,
  groupSelectionsByItem,
} from '../comboUtils';

const STATUS_CLS = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PACKED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

// Tarjeta de un pedido de combo — compartida entre la pestaña Semana
// (ComboOrdersTab) y la pestaña Histórico (ComboHistoryView). onEdit/onDelete
// son opcionales: si no se pasan, no se muestran acciones (ej. Histórico solo
// pasa onDelete).
const ComboOrderCard = ({ order, onEdit, onDelete }) => {
  const groupedSelections = groupSelectionsByItem(order.combo_order_selections);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-semibold text-slate-800 dark:text-slate-100">{order.clients?.name}</p>
        <span
          className={
            'text-xs font-medium px-2.5 py-0.5 rounded-full border ' +
            (STATUS_CLS[order.status] ?? '')
          }
        >
          {COMBO_ORDER_STATUS_LABEL[order.status] ?? order.status}
        </span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-auto">
          ₡{Number(order.price).toLocaleString('es-CR')}
        </span>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(order)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                title="Editar pedido"
              >
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(order)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                title="Eliminar pedido"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
      {groupedSelections.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {groupedSelections.map((s) => (
            <span
              key={s.combo_item_id}
              className={
                'text-xs px-2 py-0.5 rounded-lg ' +
                (s.extraQty > 0
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400')
              }
            >
              {COMBO_CATEGORY_LABEL[s.category]}: {s.combo_items?.name}
              {s.qty > 1 && ` ×${s.qty}`}
              {isGramCategory(s.category) && ` (${s.combo_items?.portion_size_g} g c/u)`}
              {s.extraQty > 0 &&
                ` · ${s.extraQty} extra${s.extraQty === 1 ? '' : 's'} +₡${s.extraTotal.toLocaleString()}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComboOrderCard;
