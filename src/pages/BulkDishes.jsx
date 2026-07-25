import { useEffect, useState, useCallback } from 'react';
import { UtensilsCrossed, Plus, Pencil, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AddBulkDish from '../components/AddBulkDish';

const BulkDishes = () => {
  const { supabase } = useApp();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const getData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('bulk_dishes')
      .select('id_bulk_dish, name, suggested_price, is_active')
      .eq('is_active', true)
      .order('name');
    if (error) console.error(error);
    setItems(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const run = async () => {
      await getData();
    };
    run();
  }, [getData]);

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
      .from('bulk_dishes')
      .update({ is_active: false })
      .eq('id_bulk_dish', deletingItem.id_bulk_dish);
    if (error) {
      sileo.error('No se pudo eliminar el plato');
      console.error(error);
      return;
    }
    sileo.success('Plato eliminado');
    setDeletingItem(null);
    getData();
  };

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={closeModal}>
            <AddBulkDish initialData={editingItem} onSuccess={closeModal} />
          </Modal>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deletingItem}
        title="¿Eliminar plato?"
        message={`Se eliminará "${deletingItem?.name ?? ''}" del catálogo de venta masiva.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Platos de Venta</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Catálogo de platos que se cocinan en lote para venta (ej. arroz con pollo)
            </p>
          </div>
          <button
            onClick={openAdd}
            className="bg-green-800 dark:bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 dark:hover:bg-green-500 transition text-sm font-medium shrink-0 shadow-sm"
          >
            <Plus size={16} /> Nuevo plato
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-600">
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
            <p>Sin platos en el catálogo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id_bulk_dish}
                className="group flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                  {item.suggested_price != null && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Precio sugerido: ₡{Number(item.suggested_price).toLocaleString('es-CR')}
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

export default BulkDishes;
