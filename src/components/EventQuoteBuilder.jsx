import { useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';
import { X, Printer, Plus, Trash2, UtensilsCrossed, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import oasisLogo from '../assets/Oasis-logo.png';

// Armador de cotización formal para un evento (operations.event_quotes).
// Arma dos listas editables — MENÚ (tiempo/categoría/plato/costo p.p.) y
// "NO INCLUYE" (costos extra: saloneros, vajilla, copas...) — a partir de
// operations.catering_dishes / operations.catering_pricing_categories, y
// genera el documento imprimible/PDF para el cliente (mismo patrón de
// ProductionPrintReport.jsx: div oculto + window.print()).

const MEAL_TIME_OPTIONS = ['Desayuno', 'Almuerzo', 'Café', 'Cena', 'Snacks/Meriendas', 'Brunch'];

const MEAL_HEADING = {
  Desayuno: 'Menú de desayunos',
  Almuerzo: 'Menú de almuerzos',
  Café: 'Menú de café',
  Cena: 'Menú de cenas',
  'Snacks/Meriendas': 'Menú de snacks/meriendas',
  Brunch: 'Menú de brunch',
};

const inputClass =
  'text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600 transition w-full';

const fmtMoney = (val) => `₡${Math.round(Number(val) || 0).toLocaleString('es-CR')}`;

const formatEventDateLong = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const month = d.toLocaleDateString('es-CR', { month: 'long' });
  return `${d.getDate()} de ${month.charAt(0).toUpperCase() + month.slice(1)} de ${d.getFullYear()}`;
};

const formatTodayLong = () => {
  const d = new Date();
  const month = d.toLocaleDateString('es-CR', { month: 'long' });
  return `${d.getDate()} de ${month} del ${d.getFullYear()}`;
};

const emptyMenuRow = (mealTime) => ({
  _key: `new-${Math.random()}`,
  id_menu_item: null,
  catering_dish_id: null,
  meal_time: mealTime || 'Almuerzo',
  category: 'Regular',
  dish_name: '',
  price_per_person: '',
});

const emptyExtraRow = () => ({
  _key: `new-${Math.random()}`,
  id_extra_item: null,
  pricing_category_id: null,
  label: '',
  unit_label: '',
  quantity: 1,
  unit_price: '',
});

const PRINT_STYLES = `
@media print {
  body > *:not(#oasis-quote-print) { display: none !important; }
  #oasis-quote-print { display: block !important; width: 100%; background: white; }
  @page { margin: 1.8cm; size: A4; }
}
`;

const EventQuoteBuilder = ({ quote, onClose }) => {
  const { supabase } = useApp();

  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validityText, setValidityText] = useState('5 días hábiles');

  const styleRef = useRef(null);
  const printDivRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    styleRef.current = style;

    const div = document.createElement('div');
    div.id = 'oasis-quote-print';
    div.style.cssText = 'display:none; font-family:system-ui,sans-serif; color:#1e293b;';
    document.body.appendChild(div);
    printDivRef.current = div;

    return () => {
      if (styleRef.current) document.head.removeChild(styleRef.current);
      if (printDivRef.current) document.body.removeChild(printDivRef.current);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: cats }, { data: dsh }, { data: mi }, { data: ei }] = await Promise.all([
        supabase
          .schema('operations')
          .from('catering_pricing_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .schema('operations')
          .from('catering_dishes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .schema('operations')
          .from('event_quote_menu_items')
          .select('*')
          .eq('event_quote_id', quote.id_event_quote)
          .order('sort_order', { ascending: true }),
        supabase
          .schema('operations')
          .from('event_quote_extra_items')
          .select('*')
          .eq('event_quote_id', quote.id_event_quote)
          .order('sort_order', { ascending: true }),
      ]);

      setCategories(cats ?? []);
      setDishes(dsh ?? []);

      if ((mi ?? []).length === 0 && (ei ?? []).length === 0) {
        // Primera vez que se arma esta cotización: se pre-llena a partir de
        // las respuestas del formulario público (tiempos de alimentación,
        // cantidad de personas, si requiere vajilla).
        const seedMenu = (quote.meal_times?.length ? quote.meal_times : ['Almuerzo']).map((mt) =>
          emptyMenuRow(mt)
        );

        const fixedCost = (cats ?? []).find((c) => c.name === 'Costo fijo de servicio');
        const dishwareCost = (cats ?? []).find((c) => c.name === 'Vajilla');

        const seedExtras = [];
        if (fixedCost) {
          seedExtras.push({
            ...emptyExtraRow(),
            pricing_category_id: fixedCost.id_pricing_category,
            label: fixedCost.name,
            unit_label: fixedCost.unit_label,
            quantity: 1,
            unit_price: fixedCost.default_unit_price ?? '',
          });
        }
        if (dishwareCost && quote.needs_dishware) {
          seedExtras.push({
            ...emptyExtraRow(),
            pricing_category_id: dishwareCost.id_pricing_category,
            label: dishwareCost.name,
            unit_label: dishwareCost.unit_label,
            quantity: quote.guest_count || 1,
            unit_price: dishwareCost.default_unit_price ?? '',
          });
        }

        setMenuItems(seedMenu);
        setExtraItems(seedExtras);
      } else {
        setMenuItems((mi ?? []).map((m) => ({ ...m, _key: `db-${m.id_menu_item}` })));
        setExtraItems(
          (ei ?? []).map((e) => {
            const cat = (cats ?? []).find((c) => c.id_pricing_category === e.pricing_category_id);
            return { ...e, unit_label: cat?.unit_label ?? '', _key: `db-${e.id_extra_item}` };
          })
        );
      }

      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, quote.id_event_quote]);

  // ── Edición de filas ──────────────────────────────────────────────────────

  const updateMenuRow = (key, patch) =>
    setMenuItems((rows) => rows.map((r) => (r._key === key ? { ...r, ...patch } : r)));

  const pickDishForRow = (key, dishId) => {
    const dish = dishes.find((d) => String(d.id_catering_dish) === String(dishId));
    if (!dish) {
      updateMenuRow(key, { catering_dish_id: null });
      return;
    }
    updateMenuRow(key, {
      catering_dish_id: dish.id_catering_dish,
      meal_time: dish.meal_time,
      category: dish.category,
      dish_name: dish.name,
      price_per_person: dish.price_per_person,
    });
  };

  const updateExtraRow = (key, patch) =>
    setExtraItems((rows) => rows.map((r) => (r._key === key ? { ...r, ...patch } : r)));

  const pickCategoryForRow = (key, catId) => {
    const cat = categories.find((c) => String(c.id_pricing_category) === String(catId));
    if (!cat) {
      updateExtraRow(key, { pricing_category_id: null });
      return;
    }
    updateExtraRow(key, {
      pricing_category_id: cat.id_pricing_category,
      label: cat.name,
      unit_label: cat.unit_label,
      unit_price: cat.default_unit_price ?? '',
    });
  };

  // ── Guardar ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);

    await supabase
      .schema('operations')
      .from('event_quote_menu_items')
      .delete()
      .eq('event_quote_id', quote.id_event_quote);
    await supabase
      .schema('operations')
      .from('event_quote_extra_items')
      .delete()
      .eq('event_quote_id', quote.id_event_quote);

    const menuPayload = menuItems
      .filter((m) => m.dish_name?.trim())
      .map((m, i) => ({
        event_quote_id: quote.id_event_quote,
        catering_dish_id: m.catering_dish_id ?? null,
        meal_time: m.meal_time,
        category: m.category || 'Regular',
        dish_name: m.dish_name.trim(),
        price_per_person: Number(m.price_per_person) || 0,
        sort_order: i,
      }));

    const extraPayload = extraItems
      .filter((e) => e.label?.trim())
      .map((e, i) => ({
        event_quote_id: quote.id_event_quote,
        pricing_category_id: e.pricing_category_id ?? null,
        label: e.label.trim(),
        quantity: Number(e.quantity) || 1,
        unit_price: Number(e.unit_price) || 0,
        sort_order: i,
      }));

    const results = await Promise.all([
      menuPayload.length
        ? supabase.schema('operations').from('event_quote_menu_items').insert(menuPayload)
        : Promise.resolve({ error: null }),
      extraPayload.length
        ? supabase.schema('operations').from('event_quote_extra_items').insert(extraPayload)
        : Promise.resolve({ error: null }),
    ]);

    setSaving(false);

    if (results.some((r) => r.error)) {
      results.forEach((r) => r.error && console.error(r.error));
      sileo.error('No se pudo guardar la cotización');
      return;
    }
    sileo.success('Cotización guardada');
  };

  // ── Documento imprimible ─────────────────────────────────────────────────

  const handleGenerate = async () => {
    await handleSave();
    const div = printDivRef.current;
    if (!div) return;

    div.innerHTML = buildQuotePrintHTML({ quote, menuItems, extraItems, validityText });
    div.style.display = 'block';

    // El logo se inserta recién ahora vía innerHTML — esperar su load/error real
    // en vez de un setTimeout fijo (con un timeout de respaldo generoso para no
    // colgar el flujo si la imagen realmente falla).
    const images = Array.from(div.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 3000);
              })
      )
    );

    window.print();
    div.style.display = 'none';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Cotización</h2>
            <p className="text-xs text-slate-400 mt-0.5">{quote.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              <Printer size={14} /> Generar documento
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-7">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">Fecha del evento:</strong>{' '}
                  {formatEventDateLong(quote.event_datetime)}
                </span>
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">Personas:</strong>{' '}
                  {quote.guest_count ?? '—'}
                </span>
                <label className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-slate-400">Vigencia</span>
                  <input
                    className={`${inputClass} max-w-[160px]`}
                    value={validityText}
                    onChange={(e) => setValidityText(e.target.value)}
                  />
                </label>
              </div>

              {/* ── MENÚ ── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <UtensilsCrossed size={13} /> Menú
                  </h3>
                  <button
                    onClick={() => setMenuItems((rows) => [...rows, emptyMenuRow()])}
                    className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    <Plus size={13} /> Agregar plato
                  </button>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-slate-400 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Tiempo</th>
                        <th className="text-left px-3 py-2 font-semibold">Categoría</th>
                        <th className="text-left px-3 py-2 font-semibold">Plato (del catálogo o libre)</th>
                        <th className="text-left px-3 py-2 font-semibold w-32">Costo p.p.</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {menuItems.map((row) => (
                        <tr key={row._key}>
                          <td className="px-3 py-2">
                            <select
                              className={inputClass}
                              value={row.meal_time}
                              onChange={(e) => updateMenuRow(row._key, { meal_time: e.target.value })}
                            >
                              {MEAL_TIME_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={inputClass}
                              value={row.category}
                              onChange={(e) => updateMenuRow(row._key, { category: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-1">
                              <select
                                className={inputClass}
                                value={row.catering_dish_id ?? ''}
                                onChange={(e) => pickDishForRow(row._key, e.target.value)}
                              >
                                <option value="">Personalizado...</option>
                                {dishes
                                  .filter((d) => d.meal_time === row.meal_time)
                                  .map((d) => (
                                    <option key={d.id_catering_dish} value={d.id_catering_dish}>
                                      {d.category} · {d.name}
                                    </option>
                                  ))}
                              </select>
                              <input
                                className={inputClass}
                                placeholder="Descripción del plato"
                                value={row.dish_name}
                                onChange={(e) => updateMenuRow(row._key, { dish_name: e.target.value })}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className={inputClass}
                              value={row.price_per_person}
                              onChange={(e) => updateMenuRow(row._key, { price_per_person: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => setMenuItems((rows) => rows.filter((r) => r._key !== row._key))}
                              className="p-1 text-slate-300 hover:text-red-600 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {menuItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-300 text-xs">
                            Sin platos agregados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── NO INCLUYE ── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <Receipt size={13} /> No incluye (costos extra)
                  </h3>
                  <button
                    onClick={() => setExtraItems((rows) => [...rows, emptyExtraRow()])}
                    className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    <Plus size={13} /> Agregar costo
                  </button>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-slate-400 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold w-48">Categoría</th>
                        <th className="text-left px-3 py-2 font-semibold">Etiqueta</th>
                        <th className="text-left px-3 py-2 font-semibold w-24">Cant.</th>
                        <th className="text-left px-3 py-2 font-semibold w-32">Precio unit.</th>
                        <th className="text-left px-3 py-2 font-semibold w-32">Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {extraItems.map((row) => (
                        <tr key={row._key}>
                          <td className="px-3 py-2">
                            <select
                              className={inputClass}
                              value={row.pricing_category_id ?? ''}
                              onChange={(e) => pickCategoryForRow(row._key, e.target.value)}
                            >
                              <option value="">Personalizado...</option>
                              {categories.map((c) => (
                                <option key={c.id_pricing_category} value={c.id_pricing_category}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={inputClass}
                              value={row.label}
                              onChange={(e) => updateExtraRow(row._key, { label: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className={inputClass}
                              value={row.quantity}
                              onChange={(e) => updateExtraRow(row._key, { quantity: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className={inputClass}
                              value={row.unit_price}
                              onChange={(e) => updateExtraRow(row._key, { unit_price: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {fmtMoney((Number(row.quantity) || 1) * (Number(row.unit_price) || 0))}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => setExtraItems((rows) => rows.filter((r) => r._key !== row._key))}
                              className="p-1 text-slate-300 hover:text-red-600 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {extraItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-slate-300 text-xs">
                            Sin costos agregados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function formatExtraLine(item) {
  const qty = Number(item.quantity) || 1;
  const unitPrice = Number(item.unit_price) || 0;
  const total = qty * unitPrice;
  if (qty > 1) {
    return `${escapeHtml(item.label)}: ${fmtMoney(total)} (${qty} × ${fmtMoney(unitPrice)}).`;
  }
  const suffix = item.unit_label && item.unit_label !== 'fijo' && item.unit_label !== 'variable' ? ` ${escapeHtml(item.unit_label)}` : '';
  return `${escapeHtml(item.label)}: ${fmtMoney(unitPrice)}${suffix}.`;
}

function buildQuotePrintHTML({ quote, menuItems, extraItems, validityText }) {
  const menuByMealTime = MEAL_TIME_OPTIONS.map((mt) => ({
    mealTime: mt,
    rows: menuItems.filter((m) => m.meal_time === mt && m.dish_name?.trim()),
  })).filter((g) => g.rows.length > 0);

  const menuSections = menuByMealTime
    .map(
      ({ mealTime, rows }) => `
    <p style="font-weight:700;margin:16px 0 8px;">${escapeHtml(MEAL_HEADING[mealTime] ?? `Menú de ${mealTime.toLowerCase()}`)}:</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #c3ce9f;">
      <thead>
        <tr style="background:#eef1e1;color:#475426;">
          <th style="padding:7px 10px;text-align:left;border:1px solid #c3ce9f;">Tiempo</th>
          <th style="padding:7px 10px;text-align:left;border:1px solid #c3ce9f;">Categoría</th>
          <th style="padding:7px 10px;text-align:left;border:1px solid #c3ce9f;">Plato</th>
          <th style="padding:7px 10px;text-align:left;border:1px solid #c3ce9f;">Costo(₡)</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr>
          <td style="padding:7px 10px;border:1px solid #e2e8f0;">${escapeHtml(r.meal_time)}</td>
          <td style="padding:7px 10px;border:1px solid #e2e8f0;">${escapeHtml(r.category)}</td>
          <td style="padding:7px 10px;border:1px solid #e2e8f0;">${escapeHtml(r.dish_name)}</td>
          <td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;color:#596b2c;white-space:nowrap;">${fmtMoney(r.price_per_person)} p.p</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>`
    )
    .join('');

  const extraLines = extraItems
    .filter((e) => e.label?.trim())
    .map((e) => `<li style="margin-bottom:4px;font-weight:700;color:#475426;">${formatExtraLine(e)}</li>`)
    .join('');

  return `<div style="padding:0 6px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;font-size:14px;line-height:1.5;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
      <img src="${oasisLogo}" alt="Oasis" style="height:90px;object-fit:contain;" />
      <div style="text-align:right;">
        <p style="margin:0;">${escapeHtml(formatTodayLong())}</p>
        <p style="margin:4px 0 0;font-weight:700;">Vigencia de cotización: ${escapeHtml(validityText)}</p>
      </div>
    </div>

    <h1 style="text-align:center;color:#596b2c;font-size:22px;margin:10px 0 24px;">OASIS FOOD SERVICE</h1>

    <p style="font-weight:700;color:#596b2c;margin:0 0 6px;">COTIZACIÓN - SERVICIO DE ALIMENTACIÓN PARA EVENTO</p>
    <p style="margin:0 0 14px;">Hola ${escapeHtml(quote.name?.split(' ')[0] || quote.name)},</p>
    <p style="margin:0 0 10px;">Muchas gracias por considerar a Oasis para tu evento ✨</p>
    <p style="margin:0 0 14px;">Con gusto te compartimos la cotización según lo conversado:</p>

    <p style="font-weight:700;margin:0 0 4px;">Fecha: ${escapeHtml(formatEventDateLong(quote.event_datetime))}</p>
    <p style="font-weight:700;margin:0 0 18px;">Cantidad de personas: ${quote.guest_count ?? '—'}</p>

    <h2 style="color:#596b2c;font-size:16px;margin:0 0 6px;">MENÚ</h2>
    ${menuSections || '<p style="color:#94a3b8;font-size:12px;">Sin platos agregados.</p>'}

    ${
      menuByMealTime.length
        ? `<p style="margin-top:14px;font-weight:700;color:#596b2c;font-size:12px;">• Costos anteriores corresponden únicamente al costo del producto (producción y traslado de alimentación).</p>`
        : ''
    }

    <div style="page-break-before:always;"></div>

    <h2 style="color:#596b2c;font-size:15px;margin:10px 0 8px;">NO INCLUYE:</h2>
    <ul style="margin:0 0 20px;padding-left:20px;">
      ${extraLines || '<li style="color:#94a3b8;">Sin costos adicionales agregados.</li>'}
    </ul>

    <h2 style="color:#596b2c;font-size:15px;margin:20px 0 8px;">CONDICIONES</h2>
    <ul style="margin:0 0 20px;padding-left:20px;">
      <li style="margin-bottom:4px;">Se requiere un adelanto del 50% para confirmar la fecha</li>
      <li style="margin-bottom:4px;">El restante se cancela previo al evento</li>
      <li style="margin-bottom:4px;">Cambios deben realizarse con al menos 48 horas de anticipación</li>
    </ul>

    <p style="margin:20px 0 6px;">Quedamos atentos a cualquier ajuste o preferencia</p>
    <p style="margin:0 0 20px;">Será un gusto ser parte de tu evento</p>
    <p style="margin:0;">Oasis Food Service</p>
  </div>`;
}

export default EventQuoteBuilder;
