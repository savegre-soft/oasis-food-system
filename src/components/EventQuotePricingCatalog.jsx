import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { Plus, Pencil, Check, X, Trash2, Tags, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from './ConfirmDialog';
import Tooltip from './Tooltip';

// Catálogo administrable de "Cotizaciones": categorías de costos (saloneros,
// vajilla, copas...) y platos de catering (para armar el MENÚ de una
// cotización). Ambos catálogos son exclusivos de este módulo — no tocan
// operations.recipes, que es para producción diaria.

const MEAL_TIME_OPTIONS = ['Desayuno', 'Almuerzo', 'Café', 'Cena', 'Snacks/Meriendas', 'Brunch'];

const inputClass =
  'text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600 transition w-full';

const fmtMoney = (val) => (val == null ? '—' : `₡${Number(val).toLocaleString('es-CR')}`);

const emptyCategory = { name: '', unit_label: 'c/u', default_unit_price: '', sort_order: 0 };
const emptyDish = { meal_time: 'Almuerzo', category: 'Regular', name: '', price_per_person: '', sort_order: 0 };

const EventQuotePricingCatalog = () => {
  const { supabase } = useApp();
  const [tab, setTab] = useState('categories'); // 'categories' | 'dishes'

  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingCategory, setEditingCategory] = useState(null); // { id_pricing_category, ...fields } or 'new'
  const [editingDish, setEditingDish] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deletingDish, setDeletingDish] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: cats, error: catErr }, { data: dsh, error: dishErr }] = await Promise.all([
      supabase
        .schema('operations')
        .from('catering_pricing_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .schema('operations')
        .from('catering_dishes')
        .select('*')
        .order('sort_order', { ascending: true }),
    ]);
    if (catErr) console.error(catErr);
    if (dishErr) console.error(dishErr);
    setCategories(cats ?? []);
    setDishes(dsh ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // ── Categorías de costos ──────────────────────────────────────────────────

  const saveCategory = async () => {
    if (!editingCategory?.name?.trim()) {
      sileo.error('El nombre es requerido');
      return;
    }
    const payload = {
      name: editingCategory.name.trim(),
      unit_label: editingCategory.unit_label?.trim() || 'c/u',
      default_unit_price:
        editingCategory.default_unit_price === '' || editingCategory.default_unit_price == null
          ? null
          : Number(editingCategory.default_unit_price),
      sort_order: Number(editingCategory.sort_order) || 0,
    };

    const query =
      editingCategory.id_pricing_category != null
        ? supabase
            .schema('operations')
            .from('catering_pricing_categories')
            .update(payload)
            .eq('id_pricing_category', editingCategory.id_pricing_category)
        : supabase.schema('operations').from('catering_pricing_categories').insert([payload]);

    const { error } = await query;
    if (error) {
      console.error(error);
      sileo.error('No se pudo guardar la categoría');
      return;
    }
    sileo.success('Categoría guardada');
    setEditingCategory(null);
    await fetchAll();
  };

  const toggleCategoryActive = async (cat) => {
    const { error } = await supabase
      .schema('operations')
      .from('catering_pricing_categories')
      .update({ is_active: !cat.is_active })
      .eq('id_pricing_category', cat.id_pricing_category);
    if (error) {
      sileo.error('No se pudo actualizar');
      return;
    }
    await fetchAll();
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    const { error } = await supabase
      .schema('operations')
      .from('catering_pricing_categories')
      .delete()
      .eq('id_pricing_category', deletingCategory.id_pricing_category);
    if (error) {
      sileo.error('No se pudo eliminar (puede estar en uso en alguna cotización)');
      setDeletingCategory(null);
      return;
    }
    sileo.success('Categoría eliminada');
    setDeletingCategory(null);
    await fetchAll();
  };

  // ── Platos de catering ───────────────────────────────────────────────────

  const saveDish = async () => {
    if (!editingDish?.name?.trim()) {
      sileo.error('El nombre del plato es requerido');
      return;
    }
    const payload = {
      meal_time: editingDish.meal_time,
      category: editingDish.category?.trim() || 'Regular',
      name: editingDish.name.trim(),
      price_per_person: Number(editingDish.price_per_person) || 0,
      sort_order: Number(editingDish.sort_order) || 0,
    };

    const query =
      editingDish.id_catering_dish != null
        ? supabase
            .schema('operations')
            .from('catering_dishes')
            .update(payload)
            .eq('id_catering_dish', editingDish.id_catering_dish)
        : supabase.schema('operations').from('catering_dishes').insert([payload]);

    const { error } = await query;
    if (error) {
      console.error(error);
      sileo.error('No se pudo guardar el plato');
      return;
    }
    sileo.success('Plato guardado');
    setEditingDish(null);
    await fetchAll();
  };

  const toggleDishActive = async (dish) => {
    const { error } = await supabase
      .schema('operations')
      .from('catering_dishes')
      .update({ is_active: !dish.is_active })
      .eq('id_catering_dish', dish.id_catering_dish);
    if (error) {
      sileo.error('No se pudo actualizar');
      return;
    }
    await fetchAll();
  };

  const handleDeleteDish = async () => {
    if (!deletingDish) return;
    const { error } = await supabase
      .schema('operations')
      .from('catering_dishes')
      .delete()
      .eq('id_catering_dish', deletingDish.id_catering_dish);
    if (error) {
      sileo.error('No se pudo eliminar (puede estar en uso en alguna cotización)');
      setDeletingDish(null);
      return;
    }
    sileo.success('Plato eliminado');
    setDeletingDish(null);
    await fetchAll();
  };

  return (
    <div>
      <ConfirmDialog
        open={!!deletingCategory}
        title="¿Eliminar esta categoría?"
        message={deletingCategory ? `"${deletingCategory.name}" se eliminará del catálogo.` : ''}
        confirmLabel="Eliminar"
        confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
      />
      <ConfirmDialog
        open={!!deletingDish}
        title="¿Eliminar este plato?"
        message={deletingDish ? `"${deletingDish.name}" se eliminará del catálogo.` : ''}
        confirmLabel="Eliminar"
        confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
        onConfirm={handleDeleteDish}
        onCancel={() => setDeletingDish(null)}
      />

      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden w-fit mb-6">
        <button
          onClick={() => setTab('categories')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition ${
            tab === 'categories'
              ? 'bg-slate-900 dark:bg-slate-700 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tags size={13} /> Categorías y precios
        </button>
        <button
          onClick={() => setTab('dishes')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition ${
            tab === 'dishes'
              ? 'bg-slate-900 dark:bg-slate-700 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UtensilsCrossed size={13} /> Platos de catering
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
      ) : tab === 'categories' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 dark:bg-slate-950 text-white text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-semibold">Categoría</th>
                  <th className="px-5 py-3 text-left font-semibold">Unidad</th>
                  <th className="px-5 py-3 text-left font-semibold">Precio</th>
                  <th className="px-5 py-3 text-center font-semibold">Activa</th>
                  <th className="px-5 py-3 text-center font-semibold w-24"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, i) => {
                  const isEditing = editingCategory?.id_pricing_category === cat.id_pricing_category;
                  return (
                    <tr
                      key={cat.id_pricing_category}
                      className={`border-t border-slate-100 dark:border-slate-800 ${
                        i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950/40'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <td className="px-5 py-2.5">
                            <input
                              className={inputClass}
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory((c) => ({ ...c, name: e.target.value }))}
                            />
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              className={inputClass}
                              value={editingCategory.unit_label}
                              onChange={(e) => setEditingCategory((c) => ({ ...c, unit_label: e.target.value }))}
                            />
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              type="number"
                              placeholder="Variable"
                              className={inputClass}
                              value={editingCategory.default_unit_price}
                              onChange={(e) =>
                                setEditingCategory((c) => ({ ...c, default_unit_price: e.target.value }))
                              }
                            />
                          </td>
                          <td className="px-5 py-2.5 text-center text-slate-300">—</td>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip label="Guardar">
                                <button
                                  onClick={saveCategory}
                                  className="p-1.5 text-green-600 hover:text-green-700 transition"
                                >
                                  <Check size={15} />
                                </button>
                              </Tooltip>
                              <Tooltip label="Cancelar">
                                <button
                                  onClick={() => setEditingCategory(null)}
                                  className="p-1.5 text-red-400 hover:text-red-600 transition"
                                >
                                  <X size={15} />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{cat.name}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{cat.unit_label}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                            {fmtMoney(cat.default_unit_price)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => toggleCategoryActive(cat)}
                              className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
                                cat.is_active
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                              }`}
                            >
                              {cat.is_active ? 'Sí' : 'No'}
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip label="Editar">
                                <button
                                  onClick={() => setEditingCategory({ ...cat })}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                  <Pencil size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip label="Eliminar">
                                <button
                                  onClick={() => setDeletingCategory(cat)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {editingCategory === 'new' ? null : null}
              </tbody>
            </table>
          </div>

          {editingCategory && editingCategory !== 'new' ? null : null}

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            {editingCategory === 'new' ? (
              <NewCategoryRow
                value={editingCategory}
                onChange={setEditingCategory}
                onCancel={() => setEditingCategory(null)}
                onSave={saveCategory}
              />
            ) : (
              <button
                onClick={() => setEditingCategory({ ...emptyCategory })}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                <Plus size={15} /> Agregar categoría
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 dark:bg-slate-950 text-white text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-semibold">Tiempo</th>
                  <th className="px-5 py-3 text-left font-semibold">Categoría</th>
                  <th className="px-5 py-3 text-left font-semibold">Plato</th>
                  <th className="px-5 py-3 text-left font-semibold">Costo p.p.</th>
                  <th className="px-5 py-3 text-center font-semibold">Activo</th>
                  <th className="px-5 py-3 text-center font-semibold w-24"></th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((dish, i) => {
                  const isEditing = editingDish?.id_catering_dish === dish.id_catering_dish;
                  return (
                    <tr
                      key={dish.id_catering_dish}
                      className={`border-t border-slate-100 dark:border-slate-800 ${
                        i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950/40'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <td className="px-5 py-2.5">
                            <select
                              className={inputClass}
                              value={editingDish.meal_time}
                              onChange={(e) => setEditingDish((d) => ({ ...d, meal_time: e.target.value }))}
                            >
                              {MEAL_TIME_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              className={inputClass}
                              value={editingDish.category}
                              onChange={(e) => setEditingDish((d) => ({ ...d, category: e.target.value }))}
                            />
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              className={inputClass}
                              value={editingDish.name}
                              onChange={(e) => setEditingDish((d) => ({ ...d, name: e.target.value }))}
                            />
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              type="number"
                              className={inputClass}
                              value={editingDish.price_per_person}
                              onChange={(e) => setEditingDish((d) => ({ ...d, price_per_person: e.target.value }))}
                            />
                          </td>
                          <td className="px-5 py-2.5 text-center text-slate-300">—</td>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip label="Guardar">
                                <button onClick={saveDish} className="p-1.5 text-green-600 hover:text-green-700 transition">
                                  <Check size={15} />
                                </button>
                              </Tooltip>
                              <Tooltip label="Cancelar">
                                <button
                                  onClick={() => setEditingDish(null)}
                                  className="p-1.5 text-red-400 hover:text-red-600 transition"
                                >
                                  <X size={15} />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{dish.meal_time}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{dish.category}</td>
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{dish.name}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                            {fmtMoney(dish.price_per_person)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => toggleDishActive(dish)}
                              className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
                                dish.is_active
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                              }`}
                            >
                              {dish.is_active ? 'Sí' : 'No'}
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip label="Editar">
                                <button
                                  onClick={() => setEditingDish({ ...dish })}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                  <Pencil size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip label="Eliminar">
                                <button
                                  onClick={() => setDeletingDish(dish)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            {editingDish === 'new' ? (
              <NewDishRow
                value={editingDish}
                onChange={setEditingDish}
                onCancel={() => setEditingDish(null)}
                onSave={saveDish}
              />
            ) : (
              <button
                onClick={() => setEditingDish({ ...emptyDish })}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                <Plus size={15} /> Agregar plato
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NewCategoryRow = ({ value, onChange, onCancel, onSave }) => (
  <div className="flex flex-wrap items-center gap-2">
    <input
      className={`${inputClass} max-w-[220px]`}
      placeholder="Nombre de la categoría"
      value={value.name}
      onChange={(e) => onChange((c) => ({ ...c, name: e.target.value }))}
      autoFocus
    />
    <input
      className={`${inputClass} max-w-[140px]`}
      placeholder="Unidad (c/u, fijo...)"
      value={value.unit_label}
      onChange={(e) => onChange((c) => ({ ...c, unit_label: e.target.value }))}
    />
    <input
      type="number"
      className={`${inputClass} max-w-[140px]`}
      placeholder="Precio (vacío = variable)"
      value={value.default_unit_price}
      onChange={(e) => onChange((c) => ({ ...c, default_unit_price: e.target.value }))}
    />
    <button onClick={onSave} className="p-1.5 text-green-600 hover:text-green-700 transition">
      <Check size={16} />
    </button>
    <button onClick={onCancel} className="p-1.5 text-red-400 hover:text-red-600 transition">
      <X size={16} />
    </button>
  </div>
);

const NewDishRow = ({ value, onChange, onCancel, onSave }) => (
  <div className="flex flex-wrap items-center gap-2">
    <select
      className={`${inputClass} max-w-[140px]`}
      value={value.meal_time}
      onChange={(e) => onChange((d) => ({ ...d, meal_time: e.target.value }))}
    >
      {MEAL_TIME_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <input
      className={`${inputClass} max-w-[120px]`}
      placeholder="Categoría (Regular...)"
      value={value.category}
      onChange={(e) => onChange((d) => ({ ...d, category: e.target.value }))}
    />
    <input
      className={`${inputClass} max-w-[220px]`}
      placeholder="Nombre del plato"
      value={value.name}
      onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
      autoFocus
    />
    <input
      type="number"
      className={`${inputClass} max-w-[140px]`}
      placeholder="Costo p.p."
      value={value.price_per_person}
      onChange={(e) => onChange((d) => ({ ...d, price_per_person: e.target.value }))}
    />
    <button onClick={onSave} className="p-1.5 text-green-600 hover:text-green-700 transition">
      <Check size={16} />
    </button>
    <button onClick={onCancel} className="p-1.5 text-red-400 hover:text-red-600 transition">
      <X size={16} />
    </button>
  </div>
);

export default EventQuotePricingCatalog;
