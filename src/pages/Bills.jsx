import { useEffect, useState } from 'react';
import { Plus, Search, DollarSign, LayoutGrid, Table, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sileo } from 'sileo';

import { useApp } from '../context/AppContext';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseTable from '../components/ExpenseTable';
import DatePicker from '../components/DatePicker';
import AddExpensive from '../components/AddExpensive';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AuthRoles from '../components/auth/AuthRoles';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const EXPENSE_PAGE_SIZE = 8;

// ── Gastos Operativos Tab ─────────────────────────────────────────────────────

const GastosTab = () => {
  const { supabase } = useApp();
  const [gastos, setGastos] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('cards');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [page, setPage] = useState(0);

  const fetchData = async () => {
    const [{ data, error }, { data: catData }] = await Promise.all([
      supabase
        .schema('operations')
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false }),
      supabase
        .schema('operations')
        .from('expense_categories')
        .select('id_expense_category, name')
        .eq('is_active', true),
    ]);
    if (error) {
      console.error(error);
      return;
    }
    const catMap = Object.fromEntries((catData || []).map((c) => [c.id_expense_category, c.name]));
    setGastos(
      data.map((item) => ({
        id: item.id_expense,
        descripcion: item.description,
        categoria: catMap[item.category_id] ?? `Categoría ${item.category_id}`,
        category_id: item.category_id,
        fecha: item.expense_date,
        monto: item.amount,
      }))
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = gastos
    .filter((g) => g.descripcion.toLowerCase().includes(search.toLowerCase()))
    .filter((g) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const fecha = new Date(g.fecha);
      return fecha >= new Date(dateRange.startDate) && fecha <= new Date(dateRange.endDate);
    });

  const total = filtered.reduce((acc, g) => acc + g.monto, 0);

  // Resetea la página al cambiar de filtro/vista — ajuste de estado durante
  // el render, mismo patrón que Payments.jsx para no depender de un efecto.
  const filtersKey = JSON.stringify([search, dateRange, view]);
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  if (filtersKey !== prevFiltersKey) {
    setPrevFiltersKey(filtersKey);
    setPage(0);
  }

  const totalPages = Math.ceil(filtered.length / EXPENSE_PAGE_SIZE);
  const paginated = filtered.slice(page * EXPENSE_PAGE_SIZE, (page + 1) * EXPENSE_PAGE_SIZE);

  const handleDelete = async () => {
    const { error } = await supabase
      .schema('operations')
      .from('expenses')
      .delete()
      .eq('id_expense', toDelete);
    if (error) {
      sileo.error('No se pudo eliminar el gasto');
      return;
    }
    sileo.success('Gasto eliminado');
    setToDelete(null);
    fetchData();
  };

  return (
    <div>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen onClose={() => setShowModal(false)}>
            <AddExpensive
              onAdded={() => {
                setShowModal(false);
                fetchData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingExpense && (
          <Modal isOpen onClose={() => setEditingExpense(null)}>
            <AddExpensive
              expense={editingExpense}
              onAdded={() => {
                setEditingExpense(null);
                fetchData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar gasto?"
        message="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 flex items-center gap-4"
        >
          <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl">
            <DollarSign className="text-slate-700 dark:text-slate-300" size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Gastado</p>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">₡{total.toLocaleString()}</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setView('cards')}
              className={`flex items-center gap-2 px-4 py-2 transition ${view === 'cards' ? 'bg-slate-800 dark:bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <LayoutGrid size={16} /> Cards
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-2 px-4 py-2 transition ${view === 'table' ? 'bg-slate-800 dark:bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <Table size={16} /> Tabla
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md"
          >
            <Plus size={18} /> Nuevo Gasto
          </motion.button>
        </div>
      </div>

      <DatePicker onChange={setDateRange} />

      <div className="relative my-6 max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-600" />
        <input
          type="text"
          placeholder="Buscar gasto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-indigo-600 transition"
        />
      </div>

      <AnimatePresence mode="wait">
        {view === 'cards' ? (
          <motion.div
            key="cards"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {paginated.map((g) => (
              <ExpenseCard key={g.id} {...g} onEdit={setEditingExpense} onDelete={setToDelete} />
            ))}
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-slate-500 dark:text-slate-400 mt-12"
              >
                No se encontraron gastos.
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ExpenseTable gastos={paginated} onEdit={setEditingExpense} onDelete={setToDelete} />
          </motion.div>
        )}
      </AnimatePresence>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 disabled:opacity-30 transition shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {'Página ' + (page + 1) + ' de ' + totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 disabled:opacity-30 transition shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const Bills = () => {
  return (
    <AuthRoles rolesNames={['Finanzas', 'Administrador']}>
      <motion.div
        className="min-h-screen bg-slate-50 dark:bg-slate-900 rounded p-8 transition-colors duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-6"
        >
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gastos Operativos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Administra los gastos operativos del negocio</p>
        </motion.div>

        <GastosTab />
      </motion.div>
    </AuthRoles>
  );
};

export default Bills;
