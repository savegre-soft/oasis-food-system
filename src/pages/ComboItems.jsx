import { useEffect, useState } from 'react';
import { UtensilsCrossed, Plus, Pencil, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AddComboItem from '../components/AddComboItem';
import { COMBO_CATEGORIES, isGramCategory } from '../components/comboUtils';

const ComboItems = () => {
  const { supabase } = useApp();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(COMBO_CATEGORIES[0].key);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const getData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('combo_items')
      .select('id_combo_item, category, name, portion_size_g, recipe_id, is_active')
      .eq('is_active', true)
      .order('name');
    if (error) console.error(error);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };
  const openEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    getData();
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    const { error } = await supabase
      .schema('operations')
      .from('combo_items')
      .update({ is_active: false })
      .eq('id_combo_item', deletingItem.id_combo_item);
    if (error) {
      sileo.error('No se pudo eliminar el ítem');
      console.error(error);
      return;
    }
    sileo.success('Ítem eliminado');
    setDeletingItem(null);
    getData();
  };

  const filtered = items.filter((i) => i.category === activeCategory);

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={closeModal}>
            <AddComboItem
              category={activeCategory}
              initialData={editingItem}
              onSuccess={closeModal}
            />
          </Modal>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deletingItem}
        title="¿Eliminar ítem?"
        message={`Se eliminará "${deletingItem?.name ?? ''}" del catálogo de combos.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Ítems de Combo</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Catálogo de opciones para armar los combos semanales
            </p>
          </div>
          <button
            onClick={openAdd}
            className="bg-green-800 dark:bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 dark:hover:bg-green-500 transition text-sm font-medium shrink-0 shadow-sm"
          >
            <Plus size={16} /> Nuevo ítem
          </button>
        </div>

        <div className="flex items-center gap-1 mb-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 w-fit shadow-sm overflow-x-auto">
          {COMBO_CATEGORIES.map(({ key, label }) => {
            const active = activeCategory === key;
            const count = items.filter((i) => i.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ' +
                  (active
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')
                }
              >
                {label}
                {count > 0 && (
                  <span
                    className={
                      'text-xs px-1.5 py-0.5 rounded-full font-semibold ' +
                      (active
                        ? 'bg-slate-600 dark:bg-slate-500 text-slate-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-600">
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
            <p>Sin ítems en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id_combo_item}
                className="group flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                  {isGramCategory(item.category) && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Porción: {item.portion_size_g} g
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ComboItems;
