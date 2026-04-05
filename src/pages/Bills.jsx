import { useEffect, useState } from 'react';
import { Plus, Search, DollarSign, LayoutGrid, Table } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sileo } from 'sileo';

import { useApp } from '../context/AppContext';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseTable from '../components/ExpenseTable';
import DatePicker from '../components/DatePicker';
import AddExpensive from '../components/AddExpensive';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const Bills = () => {
  const { supabase } = useApp();

  const [gastos, setGastos] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('cards');

  // Modal agregar
  const [showModal, setShowModal] = useState(false);
  // Modal editar
  const [editingExpense, setEditingExpense] = useState(null);
  // Confirmar eliminar
  const [toDelete, setToDelete] = useState(null);

  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

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

    const catMap = Object.fromEntries(
      (catData || []).map((c) => [c.id_expense_category, c.name])
    );

    const formatted = data.map((item) => ({
      id: item.id_expense,
      descripcion: item.description,
      categoria: catMap[item.category_id] ?? `Categoría ${item.category_id}`,
      category_id: item.category_id,
      fecha: item.expense_date,
      monto: item.amount,
    }));

    setGastos(formatted);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const gastosFiltrados = gastos
    .filter((g) => g.descripcion.toLowerCase().includes(search.toLowerCase()))
    .filter((g) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const fecha = new Date(g.fecha);
      return fecha >= new Date(dateRange.startDate) && fecha <= new Date(dateRange.endDate);
    });

  const totalGastos = gastosFiltrados.reduce((acc, g) => acc + g.monto, 0);

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

  const closeAdd = () => {
    setShowModal(false);
    fetchData();
  };

  const closeEdit = () => {
    setEditingExpense(null);
    fetchData();
  };

  return (
    <motion.div
      className="min-h-screen bg-slate-100 rounded p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Modal Agregar */}
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <AddExpensive onAdded={closeAdd} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal Editar */}
      <AnimatePresence>
        {editingExpense && (
          <Modal isOpen={!!editingExpense} onClose={() => setEditingExpense(null)}>
            <AddExpensive expense={editingExpense} onAdded={closeEdit} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Confirmar Eliminar */}
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar gasto?"
        message="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Control de Gastos</h1>
          <p className="text-slate-500 mt-1">Administra los gastos de tu negocio</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-md"
        >
          <Plus size={18} />
          Nuevo Gasto
        </motion.button>
      </motion.div>

      {/* DatePicker */}
      <DatePicker onChange={setDateRange} />

      {/* Resumen + Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4"
        >
          <div className="bg-slate-100 p-3 rounded-xl">
            <DollarSign className="text-slate-700" size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Gastado</p>
            <p className="text-xl font-semibold text-slate-800">₡{totalGastos.toLocaleString()}</p>
          </div>
        </motion.div>

        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setView('cards')}
            className={`flex items-center gap-2 px-4 py-2 transition ${
              view === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid size={16} />
            Cards
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-2 px-4 py-2 transition ${
              view === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Table size={16} />
            Tabla
          </button>
        </div>
      </div>

      {/* Buscador */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mb-8 max-w-md"
      >
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar gasto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
        />
      </motion.div>

      {/* Vista */}
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
            {gastosFiltrados.map((gasto) => (
              <ExpenseCard
                key={gasto.id}
                {...gasto}
                onEdit={setEditingExpense}
                onDelete={setToDelete}
              />
            ))}

            {gastosFiltrados.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-slate-500 mt-12"
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
            <ExpenseTable
              gastos={gastosFiltrados}
              onEdit={setEditingExpense}
              onDelete={setToDelete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Bills;
