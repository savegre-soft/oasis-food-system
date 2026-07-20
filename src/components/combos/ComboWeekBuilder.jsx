import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';
import { COMBO_CATEGORIES, isGramCategory } from '../comboUtils';
import { toDateString } from '../orderUtils';

// Construye/abre el combo de la semana: precio base, y por categoría qué
// ítems del catálogo están disponibles + cuántos puede elegir el cliente.
const ComboWeekBuilder = ({ onSuccess }) => {
  const { supabase } = useApp();

  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const today = new Date();
  const inSevenDays = new Date(today);
  inSevenDays.setDate(today.getDate() + 6);

  const [weekStart, setWeekStart] = useState(toDateString(today));
  const [weekEnd, setWeekEnd] = useState(toDateString(inSevenDays));
  const [basePrice, setBasePrice] = useState('');

  // { [category]: { maxSelections: number, itemIds: Set<number>, extraPrices: {itemId: string} } }
  const emptyConfig = () =>
    Object.fromEntries(
      COMBO_CATEGORIES.map((c) => [c.key, { maxSelections: 1, itemIds: new Set(), extraPrices: {} }])
    );
  const [config, setConfig] = useState(emptyConfig());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('combo_items')
        .select('id_combo_item, category, name, portion_size_g')
        .eq('is_active', true)
        .order('name');
      if (error) console.error(error);
      setCatalog(data ?? []);
      setLoadingCatalog(false);
    };
    fetchCatalog();
  }, []);

  const toggleItem = (category, itemId) => {
    setConfig((prev) => {
      const cat = prev[category];
      const itemIds = new Set(cat.itemIds);
      if (itemIds.has(itemId)) itemIds.delete(itemId);
      else itemIds.add(itemId);
      return { ...prev, [category]: { ...cat, itemIds } };
    });
  };

  const setMaxSelections = (category, value) => {
    setConfig((prev) => ({
      ...prev,
      [category]: { ...prev[category], maxSelections: Math.max(1, Number(value) || 1) },
    }));
  };

  const setExtraPrice = (category, itemId, value) => {
    setConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        extraPrices: { ...prev[category].extraPrices, [itemId]: value },
      },
    }));
  };

  const hasAnySelection = COMBO_CATEGORIES.some((c) => config[c.key].itemIds.size > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (basePrice === '' || Number(basePrice) < 0) {
      sileo.error('Ingresa el precio base del combo');
      return;
    }
    if (!hasAnySelection) {
      sileo.error('Selecciona al menos un ítem en alguna categoría');
      return;
    }
    // El Plato Extra siempre debe tener un costo asociado — sin esto,
    // AddComboOrder.jsx no podría calcular el precio final del combo
    // automáticamente cuando el cliente elige un plato extra.
    const platoExtra = config.plato_extra;
    for (const itemId of platoExtra.itemIds) {
      const price = Number(platoExtra.extraPrices[itemId]);
      if (!price || price <= 0) {
        const itemName = catalog.find((i) => i.id_combo_item === itemId)?.name ?? 'un ítem';
        sileo.error(`Ingresa el costo del Plato Extra "${itemName}"`);
        return;
      }
    }
    setLoading(true);

    const { data: weekData, error: weekError } = await supabase
      .schema('operations')
      .from('combo_weeks')
      .insert([
        {
          week_start_date: weekStart,
          week_end_date: weekEnd,
          base_price: Number(basePrice),
          status: 'open',
        },
      ])
      .select('id_combo_week')
      .single();

    if (weekError) {
      sileo.error('Error al crear el combo de la semana');
      console.error(weekError);
      setLoading(false);
      return;
    }

    for (const { key: category } of COMBO_CATEGORIES) {
      const cat = config[category];
      if (cat.itemIds.size === 0) continue;

      const { data: catData, error: catError } = await supabase
        .schema('operations')
        .from('combo_week_categories')
        .insert([
          {
            combo_week_id: weekData.id_combo_week,
            category,
            max_selections: cat.maxSelections,
          },
        ])
        .select('id_combo_week_category')
        .single();

      if (catError) {
        sileo.error(`Error al guardar la categoría ${category}`);
        console.error(catError);
        setLoading(false);
        return;
      }

      const rows = [...cat.itemIds].map((itemId) => ({
        combo_week_category_id: catData.id_combo_week_category,
        combo_item_id: itemId,
        extra_price:
          category === 'plato_extra' ? Number(cat.extraPrices[itemId]) || 0 : null,
      }));

      const { error: itemsError } = await supabase
        .schema('operations')
        .from('combo_week_category_items')
        .insert(rows);

      if (itemsError) {
        sileo.error(`Error al guardar los ítems de ${category}`);
        console.error(itemsError);
        setLoading(false);
        return;
      }
    }

    sileo.success('Combo de la semana configurado');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-2 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Configurar combo de la semana</h2>
      <p className="text-sm text-slate-500 mb-6">
        Elegí qué opciones están disponibles esta semana por categoría y cuántas puede elegir cada
        cliente.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Inicio</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Fin</label>
            <input
              type="date"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Precio base</label>
            <input
              type="number"
              min="0"
              step="1"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="₡"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
        </div>

        {loadingCatalog ? (
          <p className="text-sm text-slate-400">Cargando catálogo...</p>
        ) : (
          COMBO_CATEGORIES.map(({ key, label, unit }) => {
            const catalogItems = catalog.filter((i) => i.category === key);
            const cat = config[key];
            return (
              <div key={key} className="border-2 border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">
                    {label} <span className="text-slate-400 font-normal">({unit})</span>
                  </p>
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    Máx. a elegir
                    <input
                      type="number"
                      min="1"
                      value={cat.maxSelections}
                      onChange={(e) => setMaxSelections(key, e.target.value)}
                      className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center"
                    />
                  </label>
                </div>

                {catalogItems.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Sin ítems en el catálogo para esta categoría —{' '}
                    <a href="/combo-items" className="underline">
                      crear ítems
                    </a>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {catalogItems.map((item) => {
                      const checked = cat.itemIds.has(item.id_combo_item);
                      return (
                        <div key={item.id_combo_item} className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm text-slate-700 flex-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleItem(key, item.id_combo_item)}
                            />
                            {item.name}
                            {isGramCategory(key) && (
                              <span className="text-xs text-slate-400">
                                ({item.portion_size_g} g)
                              </span>
                            )}
                          </label>
                          {key === 'plato_extra' && checked && (
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Costo extra"
                              value={cat.extraPrices[item.id_combo_item] ?? ''}
                              onChange={(e) =>
                                setExtraPrice(key, item.id_combo_item, e.target.value)
                              }
                              className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        <button
          type="submit"
          disabled={loading || loadingCatalog}
          className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Guardando...' : 'Guardar combo de la semana'}
        </button>
      </form>
    </div>
  );
};

export default ComboWeekBuilder;
