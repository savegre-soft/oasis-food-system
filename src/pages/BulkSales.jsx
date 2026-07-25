import { useEffect, useState, useCallback } from 'react';
import { Plus, Boxes } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AddBulkSaleBatch from '../components/bulkSales/AddBulkSaleBatch';
import AddBulkSaleEntry from '../components/bulkSales/AddBulkSaleEntry';
import BulkSaleBatchCard from '../components/bulkSales/BulkSaleBatchCard';
import { summarizeBatch } from '../components/bulkSalesUtils';

const BATCH_SELECT = `
  id_bulk_sale_batch, batch_date, quantity_cooked, notes,
  bulk_dishes ( id_bulk_dish, name, suggested_price ),
  bulk_sale_entries ( id_bulk_sale_entry, client_id, quantity, amount, payment_id, clients ( id_client, name ) )
`;

const BulkSales = () => {
  const { supabase } = useApp();

  const [dishes, setDishes] = useState([]);
  const [clients, setClients] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [saleBatch, setSaleBatch] = useState(null); // batch al que se le está registrando una venta
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(null);

  const getBatches = useCallback(async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('bulk_sale_batches')
      .select(BATCH_SELECT)
      .order('batch_date', { ascending: false })
      .order('id_bulk_sale_batch', { ascending: false });
    if (error) console.error(error);
    setBatches(data ?? []);
  }, [supabase]);

  const getData = useCallback(async () => {
    setLoading(true);
    const [dishesRes, clientsRes] = await Promise.all([
      supabase
        .schema('operations')
        .from('bulk_dishes')
        .select('id_bulk_dish, name, suggested_price')
        .eq('is_active', true)
        .order('name'),
      supabase.schema('operations').from('clients').select('id_client, name').order('name'),
    ]);
    setDishes(dishesRes.data ?? []);
    setClients(clientsRes.data ?? []);
    await getBatches();
    setLoading(false);
  }, [supabase, getBatches]);

  useEffect(() => {
    const run = async () => {
      await getData();
    };
    run();
  }, [getData]);

  const closeAddBatch = () => {
    setShowAddBatch(false);
    getBatches();
  };

  const closeAddSale = () => {
    setSaleBatch(null);
    getBatches();
  };

  const handleDeleteEntry = async () => {
    if (!deletingEntry) return;
    const { error: entryError } = await supabase
      .schema('operations')
      .from('bulk_sale_entries')
      .delete()
      .eq('id_bulk_sale_entry', deletingEntry.id_bulk_sale_entry);
    if (entryError) {
      sileo.error('Error al eliminar la venta');
      console.error(entryError);
      return;
    }
    if (deletingEntry.payment_id) {
      const { error: paymentError } = await supabase
        .schema('operations')
        .from('payments')
        .delete()
        .eq('id_payment', deletingEntry.payment_id);
      if (paymentError) console.error(paymentError);
    }
    sileo.success('Venta eliminada');
    setDeletingEntry(null);
    getBatches();
  };

  const handleDeleteBatch = async () => {
    if (!deletingBatch) return;
    const { error } = await supabase
      .schema('operations')
      .from('bulk_sale_batches')
      .delete()
      .eq('id_bulk_sale_batch', deletingBatch.id_bulk_sale_batch);
    if (error) {
      sileo.error('Error al eliminar el lote');
      console.error(error);
      return;
    }
    sileo.success('Lote eliminado');
    setDeletingBatch(null);
    getBatches();
  };

  const totalCooked = batches.reduce((s, b) => s + Number(b.quantity_cooked || 0), 0);
  const totalIncome = batches.reduce((s, b) => s + summarizeBatch(b).totalIncome, 0);

  return (
    <>
      <AnimatePresence>
        {showAddBatch && (
          <Modal isOpen={showAddBatch} onClose={closeAddBatch}>
            <AddBulkSaleBatch dishes={dishes} onSuccess={closeAddBatch} />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saleBatch && (
          <Modal isOpen={!!saleBatch} onClose={closeAddSale}>
            <AddBulkSaleEntry
              batch={saleBatch}
              clients={clients}
              leftover={summarizeBatch(saleBatch).leftover}
              onSuccess={closeAddSale}
            />
          </Modal>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deletingEntry}
        title="¿Eliminar venta?"
        message="Se eliminará esta venta y su ingreso asociado."
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeletingEntry(null)}
      />

      <ConfirmDialog
        open={!!deletingBatch}
        title="¿Eliminar lote?"
        message={`Se eliminará el lote de "${deletingBatch?.bulk_dishes?.name ?? ''}".`}
        onConfirm={handleDeleteBatch}
        onCancel={() => setDeletingBatch(null)}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Ventas Masivas</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Lotes de un solo plato cocinados para venta (ej. 50 porciones de arroz con pollo)
            </p>
          </div>
          <button
            onClick={() => setShowAddBatch(true)}
            className="bg-green-800 dark:bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 dark:hover:bg-green-500 transition text-sm font-medium shrink-0 shadow-sm"
          >
            <Plus size={16} /> Nuevo lote
          </button>
        </div>

        {!loading && batches.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 max-w-xl">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Lotes</p>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{batches.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Cocinado</p>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{totalCooked}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Ingresos</p>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                ₡{totalIncome.toLocaleString('es-CR')}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
        ) : batches.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-600">
            <Boxes size={40} className="mx-auto mb-3 opacity-30" />
            <p>Sin lotes registrados todavía</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {batches.map((batch) => (
              <BulkSaleBatchCard
                key={batch.id_bulk_sale_batch}
                batch={batch}
                onAddSale={setSaleBatch}
                onDeleteEntry={setDeletingEntry}
                onDeleteBatch={setDeletingBatch}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BulkSales;
