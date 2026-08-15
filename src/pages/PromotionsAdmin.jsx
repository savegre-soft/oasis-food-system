import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { Plus, Pencil, EyeOff, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PromotionFormModal from '../components/PromotionFormModal';
import Tooltip from '../components/Tooltip';

const SOURCE_LABEL = { manual: 'Manual', combo: 'Combo semanal', bulk_dish: 'Venta masiva' };

// Precio a mostrar: si la promoción está vinculada a un combo/plato, se
// muestra el precio en vivo (join) — si cambia el original, se refleja acá
// sin tener que editar la promoción. `price_label` es solo el respaldo para
// cuando es manual o el vínculo se borró.
const getDisplayPrice = (promo) => {
  if (promo.source_type === 'combo' && promo.combo_weeks?.base_price != null) {
    return `₡${Number(promo.combo_weeks.base_price).toLocaleString('es-CR')}`;
  }
  if (promo.source_type === 'bulk_dish' && promo.bulk_dishes?.suggested_price != null) {
    return `₡${Number(promo.bulk_dishes.suggested_price).toLocaleString('es-CR')}`;
  }
  return promo.price_label;
};

// Panel interno de administración de promociones (RF-PUB-02) — lo que
// consume /promociones (sitio público, solo lee las activas).
const PromotionsAdmin = () => {
  const { supabase } = useApp();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const fetchPromotions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('promotions')
      .select('*, combo_weeks(base_price, week_start_date, week_end_date), bulk_dishes(name, suggested_price)')
      .order('display_order', { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setPromotions(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchPromotions(), 0);
    return () => clearTimeout(timer);
  }, [supabase]);

  const toggleActive = async (promo) => {
    const { error } = await supabase
      .schema('operations')
      .from('promotions')
      .update({ is_active: !promo.is_active })
      .eq('id_promotion', promo.id_promotion);

    if (error) {
      sileo.error('No se pudo actualizar la promoción');
      return;
    }
    sileo.success(promo.is_active ? 'Promoción desactivada' : 'Promoción activada');
    await fetchPromotions();
  };

  const openCreate = () => {
    setEditingPromotion(null);
    setShowForm(true);
  };

  const openEdit = (promo) => {
    setEditingPromotion(promo);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
      <PromotionFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        initialData={editingPromotion}
        onSuccess={async () => {
          setShowForm(false);
          await fetchPromotions();
        }}
      />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Promociones</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Administrá las promociones que se muestran en el sitio público.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition shrink-0"
        >
          <Plus size={16} /> Nueva promoción
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          No hay promociones creadas todavía.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <div
              key={promo.id_promotion}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm ${
                !promo.is_active ? 'opacity-60' : ''
              }`}
            >
              {promo.image_url && (
                <img src={promo.image_url} alt={promo.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-slate-800 dark:text-white">{promo.title}</h3>
                  {!promo.is_active && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                      Inactiva
                    </span>
                  )}
                </div>
                {promo.source_type !== 'manual' && (
                  <span className="inline-block text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full mb-2">
                    {SOURCE_LABEL[promo.source_type] ?? promo.source_type}
                  </span>
                )}
                {promo.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{promo.description}</p>
                )}
                <div className="flex items-center justify-between">
                  {getDisplayPrice(promo) && (
                    <span className="font-bold text-slate-800 dark:text-white">{getDisplayPrice(promo)}</span>
                  )}
                  <div className="flex gap-1">
                    <Tooltip label="Editar">
                      <button
                        onClick={() => openEdit(promo)}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Pencil size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip label={promo.is_active ? 'Desactivar' : 'Activar'}>
                      <button
                        onClick={() => toggleActive(promo)}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        {promo.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromotionsAdmin;
