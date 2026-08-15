import { Minus, Plus } from 'lucide-react';
import { COMBO_CATEGORIES, isGramCategory, isPooledCategory } from '../comboUtils';

// Bloque de selección de ítems del combo (categorías → ítems con stepper de
// cantidad), compartido entre AddComboOrder y EditComboOrder. El estado vive
// en el hook useComboSelections del componente padre; acá solo se renderiza
// y se disparan los callbacks — onIncrement decide ahí si la unidad entra en
// el cupo normal o dispara el modal de extra (necesita el nombre del ítem y
// el máximo de la categoría, que ya conoce el padre).
const ComboCategorySelector = ({
  categories,
  poolTotal,
  pooledUsed,
  qtyOf,
  extraCountOf,
  extraTotalOf,
  onIncrement,
  onDecrement,
}) => (
  <div className="space-y-4">
    {poolTotal > 0 && (
      <div className="flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Unidades usadas (Arroz/Proteína/Acompañamiento/Extra)
        </span>
        <span
          className={`text-sm font-semibold ${pooledUsed > poolTotal ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}
        >
          {pooledUsed} / {poolTotal}
        </span>
      </div>
    )}
    <p className="text-xs text-slate-400 dark:text-slate-500">
      Un mismo ítem se puede elegir varias veces. Si el cliente quiere más de lo que permite el
      combo, se puede agregar igual: cada unidad que exceda el máximo se cobra automáticamente al
      precio individual del ítem.
    </p>
    {categories.map((cat) => {
      const meta = COMBO_CATEGORIES.find((c) => c.key === cat.category);
      const pooled = isPooledCategory(cat.category);
      return (
        <div
          key={cat.id_combo_week_category}
          className="border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4"
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
            {meta?.label ?? cat.category}{' '}
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              {pooled
                ? `(sugerido: ${cat.max_selections}, según unidades disponibles)`
                : `(elige hasta ${cat.max_selections})`}
            </span>
          </p>
          <div className="space-y-2.5">
            {(cat.combo_week_category_items ?? []).map((cwci) => {
              const item = cwci.combo_items;
              const qty = qtyOf(cat.category, cwci.combo_item_id);
              const extraQty = extraCountOf(cat.category, cwci.combo_item_id);
              const extraTotal = extraTotalOf(cat.category, cwci.combo_item_id);
              return (
                <div
                  key={cwci.id_combo_week_category_item}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDecrement(cat.category, cwci.combo_item_id)}
                      disabled={qty === 0}
                      className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center font-semibold text-slate-800 dark:text-slate-100">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onIncrement(
                          cat.category,
                          cwci.combo_item_id,
                          cat.max_selections,
                          item?.name,
                          item?.price
                        )
                      }
                      className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="flex-1">
                    {item?.name}
                    {isGramCategory(cat.category) && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {' '}
                        ({item?.portion_size_g} g c/u)
                      </span>
                    )}
                  </span>
                  {cat.category === 'plato_extra' && qty - extraQty > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                      +₡{Number(item?.price ?? 0).toLocaleString()} c/u
                    </span>
                  )}
                  {extraQty > 0 && (
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded shrink-0">
                      {extraQty} extra{extraQty === 1 ? '' : 's'} +₡{extraTotal.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
);

export default ComboCategorySelector;
