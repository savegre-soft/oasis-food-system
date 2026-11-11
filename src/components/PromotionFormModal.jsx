import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { ImagePlus } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { SOURCE_TYPE_LABEL } from '../lib/promotionSourceLabels';

// Alta/edición de promociones del sitio público (RF-PUB-02). Reusable para
// crear (initialData=null) y editar (initialData=promoción real) — el modo
// se decide por la presencia de id_promotion, no por initialData en sí, para
// poder eventualmente prellenar el form sin forzar modo edición.
//
// Esta pasarela solo crea promociones de origen manual — las de Combo/Venta
// se publican desde sus propias secciones (botón "Publicar" en Combos.jsx y
// en Pedidos de Ventas) y solo quedan editables acá para su título,
// descripción, precio visible, etiqueta e imagen; el vínculo (`source_type`,
// `combo_week_id`, `bulk_dish_id`) no se toca desde este form.
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

  const sourceType = initialData?.source_type ?? 'manual';

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
  }, [isOpen, initialData]);

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
      };

      if (!isEdit) payload.source_type = 'manual';

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

        {isEdit && sourceType !== 'manual' ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Origen
            </label>
            <span className="inline-block w-fit text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl">
              {SOURCE_TYPE_LABEL[sourceType] ?? sourceType}
            </span>
            <p className="text-xs text-slate-400">
              Esta promoción se publicó desde su sección de origen — acá solo se edita cómo se muestra
              en el sitio público.
            </p>
          </div>
        ) : null}

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
