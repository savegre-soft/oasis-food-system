import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { ImagePlus } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';

const fmtDate = (str, opts) => new Date(str + 'T00:00:00').toLocaleDateString('es-CR', opts);
const fmtPrice = (n) => `₡${Number(n).toLocaleString('es-CR')}`;

const comboWeekLabel = (week) =>
  `${fmtDate(week.week_start_date, { day: '2-digit', month: 'short' })} – ${fmtDate(week.week_end_date, { day: '2-digit', month: 'short' })} (${fmtPrice(week.base_price)})`;

const comboWeekTitle = (week) =>
  `Combo semanal ${fmtDate(week.week_start_date, { day: '2-digit', month: 'short' })} – ${fmtDate(week.week_end_date, { day: '2-digit', month: 'short' })}`;

// Alta/edición de promociones del sitio público (RF-PUB-02). Reusable para
// crear (initialData=null) y editar (initialData=promoción real) — el modo
// se decide por la presencia de id_promotion, no por initialData en sí, para
// poder eventualmente prellenar el form sin forzar modo edición.
//
// Una promoción puede basarse en un Combo semanal o un plato de Venta Masiva
// ya registrados (source_type), autocompletando título/precio al elegirlos.
// `price_label` queda como respaldo — el precio en vivo se muestra en
// PromotionsAdmin.jsx/Promotions.jsx vía join, no se recalcula acá.
const PromotionFormModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const { supabase } = useApp();
  const isEdit = !!initialData?.id_promotion;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [badge, setBadge] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const [sourceType, setSourceType] = useState('manual'); // 'manual' | 'combo' | 'bulk_dish'
  const [comboWeekId, setComboWeekId] = useState('');
  const [bulkDishId, setBulkDishId] = useState('');
  const [comboWeeks, setComboWeeks] = useState([]);
  const [bulkDishes, setBulkDishes] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialData?.title ?? '');
    setDescription(initialData?.description ?? '');
    setPriceLabel(initialData?.price_label ?? '');
    setBadge(initialData?.badge ?? '');
    setDisplayOrder(initialData?.display_order ?? 0);
    setIsActive(initialData?.is_active ?? true);
    setImageFile(null);
    setImagePreview(initialData?.image_url ?? null);
    setSourceType(initialData?.source_type ?? 'manual');
    setComboWeekId(initialData?.combo_week_id ? String(initialData.combo_week_id) : '');
    setBulkDishId(initialData?.bulk_dish_id ? String(initialData.bulk_dish_id) : '');
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    const loadSources = async () => {
      const [{ data: weeks }, { data: dishes }] = await Promise.all([
        supabase
          .schema('operations')
          .from('combo_weeks')
          .select('id_combo_week, week_start_date, week_end_date, base_price')
          .order('id_combo_week', { ascending: false })
          .limit(10),
        supabase
          .schema('operations')
          .from('bulk_dishes')
          .select('id_bulk_dish, name, suggested_price')
          .eq('is_active', true)
          .order('name'),
      ]);
      setComboWeeks(weeks ?? []);
      setBulkDishes(dishes ?? []);
    };

    loadSources();
  }, [isOpen, supabase]);

  const handleSelectCombo = (id) => {
    setComboWeekId(id);
    const week = comboWeeks.find((w) => String(w.id_combo_week) === id);
    if (week) {
      setTitle(comboWeekTitle(week));
      setPriceLabel(fmtPrice(week.base_price));
    }
  };

  const handleSelectBulkDish = (id) => {
    setBulkDishId(id);
    const dish = bulkDishes.find((d) => String(d.id_bulk_dish) === id);
    if (dish) {
      setTitle(dish.name);
      if (dish.suggested_price != null) setPriceLabel(fmtPrice(dish.suggested_price));
    }
  };

  const handleSourceTypeChange = (type) => {
    setSourceType(type);
    if (type !== 'combo') setComboWeekId('');
    if (type !== 'bulk_dish') setBulkDishId('');
  };

  const canSubmit = title.trim() !== '';

  const handleImageChange = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return initialData?.image_url ?? null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${initialData?.id_promotion ?? 'new'}.${fileExt}`;
    const filePath = `promotions/${fileName}`;

    const { error } = await supabase.storage
      .from('promotion-images')
      .upload(filePath, imageFile, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('promotion-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);

    try {
      const imageUrl = await uploadImage();

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        price_label: priceLabel.trim() || null,
        badge: badge.trim() || null,
        display_order: Number(displayOrder) || 0,
        is_active: isActive,
        image_url: imageUrl,
        source_type: sourceType,
        combo_week_id: sourceType === 'combo' && comboWeekId ? Number(comboWeekId) : null,
        bulk_dish_id: sourceType === 'bulk_dish' && bulkDishId ? Number(bulkDishId) : null,
      };

      const { error } = isEdit
        ? await supabase
            .schema('operations')
            .from('promotions')
            .update(payload)
            .eq('id_promotion', initialData.id_promotion)
        : await supabase.schema('operations').from('promotions').insert([payload]);

      if (error) throw error;

      sileo.success(isEdit ? 'Promoción actualizada' : 'Promoción creada');
      setLoading(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      sileo.error('No se pudo guardar la promoción');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5 max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          {isEdit ? 'Editar promoción' : 'Nueva promoción'}
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Origen
          </label>
          <div className="flex gap-2">
            {[
              ['manual', 'Manual'],
              ['combo', 'Combo semanal'],
              ['bulk_dish', 'Venta masiva'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSourceTypeChange(val)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  sourceType === val
                    ? 'bg-slate-800 dark:bg-indigo-600 border-slate-800 dark:border-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {sourceType === 'combo' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Combo semanal
            </label>
            <select
              value={comboWeekId}
              onChange={(e) => handleSelectCombo(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600"
            >
              <option value="">Elegí un combo semanal...</option>
              {comboWeeks.map((week) => (
                <option key={week.id_combo_week} value={week.id_combo_week}>
                  {comboWeekLabel(week)}
                </option>
              ))}
            </select>
            {comboWeeks.length === 0 && (
              <p className="text-xs text-slate-400">No hay combos semanales registrados todavía.</p>
            )}
          </div>
        )}

        {sourceType === 'bulk_dish' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Plato de venta masiva
            </label>
            <select
              value={bulkDishId}
              onChange={(e) => handleSelectBulkDish(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600"
            >
              <option value="">Elegí un plato...</option>
              {bulkDishes.map((dish) => (
                <option key={dish.id_bulk_dish} value={dish.id_bulk_dish}>
                  {dish.name}
                  {dish.suggested_price != null ? ` (${fmtPrice(dish.suggested_price)})` : ''}
                </option>
              ))}
            </select>
            {bulkDishes.length === 0 && (
              <p className="text-xs text-slate-400">No hay platos de venta masiva activos todavía.</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Descripción
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Precio (texto libre)
            </label>
            <input
              type="text"
              placeholder="₡4,500"
              value={priceLabel}
              onChange={(e) => setPriceLabel(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600"
            />
            {sourceType !== 'manual' && (
              <p className="text-xs text-slate-400">
                Solo se usa si se borra el vínculo — mientras esté vinculado se muestra el precio en vivo.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Etiqueta
            </label>
            <input
              type="text"
              placeholder="Más vendido"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Imagen
          </label>
          <label className="flex items-center gap-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition">
            <ImagePlus size={18} />
            {imageFile ? imageFile.name : 'Subir imagen'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0])}
            />
          </label>
          {imagePreview && (
            <img src={imagePreview} alt="Vista previa" className="mt-2 w-full h-32 object-cover rounded-xl" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Orden
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 select-none cursor-pointer pb-2.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-slate-800"
            />
            Activa
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear promoción'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PromotionFormModal;
