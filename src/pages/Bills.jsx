import { useEffect, useState } from 'react';
import { Plus, Search, DollarSign, LayoutGrid, Table, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sileo } from 'sileo';

import { useApp } from '../context/AppContext';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseTable from '../components/ExpenseTable';
import DatePicker from '../components/DatePicker';
import AddExpensive from '../components/AddExpensive';
import AddExpenseEmployee from '../components/AddExpenseEmployee';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

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
    if (error) { console.error(error); return; }
    const catMap = Object.fromEntries((catData || []).map((c) => [c.id_expense_category, c.name]));
    setGastos(data.map((item) => ({
      id: item.id_expense,
      descripcion: item.description,
      categoria: catMap[item.category_id] ?? `Categoría ${item.category_id}`,
      category_id: item.category_id,
      fecha: item.expense_date,
      monto: item.amount,
    })));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = gastos
    .filter((g) => g.descripcion.toLowerCase().includes(search.toLowerCase()))
    .filter((g) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const fecha = new Date(g.fecha);
      return fecha >= new Date(dateRange.startDate) && fecha <= new Date(dateRange.endDate);
    });

  const total = filtered.reduce((acc, g) => acc + g.monto, 0);

  const handleDelete = async () => {
    const { error } = await supabase
      .schema('operations')
      .from('expenses')
      .delete()
      .eq('id_expense', toDelete);
    if (error) { sileo.error('No se pudo eliminar el gasto'); return; }
    sileo.success('Gasto eliminado');
    setToDelete(null);
    fetchData();
  };

  return (
    <div>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen onClose={() => setShowModal(false)}>
            <AddExpensive onAdded={() => { setShowModal(false); fetchData(); }} />
          </Modal>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingExpense && (
          <Modal isOpen onClose={() => setEditingExpense(null)}>
            <AddExpensive expense={editingExpense} onAdded={() => { setEditingExpense(null); fetchData(); }} />
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
          className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4"
        >
          <div className="bg-slate-100 p-3 rounded-xl">
            <DollarSign className="text-slate-700" size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Gastado</p>
            <p className="text-xl font-semibold text-slate-800">₡{total.toLocaleString()}</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setView('cards')}
              className={`flex items-center gap-2 px-4 py-2 transition ${view === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutGrid size={16} /> Cards
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-2 px-4 py-2 transition ${view === 'table' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Table size={16} /> Tabla
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-md"
          >
            <Plus size={18} /> Nuevo Gasto
          </motion.button>
        </div>
      </div>

      <DatePicker onChange={setDateRange} />

      <div className="relative my-6 max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar gasto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
        />
      </div>

      <AnimatePresence mode="wait">
        {view === 'cards' ? (
          <motion.div key="cards" variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            {filtered.map((g) => (
              <ExpenseCard key={g.id} {...g} onEdit={setEditingExpense} onDelete={setToDelete} />
            ))}
            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 mt-12">
                No se encontraron gastos.
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExpenseTable gastos={filtered} onEdit={setEditingExpense} onDelete={setToDelete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Personal Tab ──────────────────────────────────────────────────────────────

const PersonalTab = () => {
  const { supabase } = useApp();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('cards');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('empCost')
        .select('*')
        .order('WorkDate', { ascending: false });
      if (error) { console.error(error); return; }
      setRecords(data.map((item) => ({
        id: item.id,
        descripcion: item.Name,
        hours: item.Hours,
        categoria: `${item.Hours} horas`,
        fecha: item.WorkDate,
        monto: item.Amount,
      })));
    })();
  }, [supabase, refreshKey]);

  const filtered = records
    .filter((e) => e.descripcion.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const fecha = new Date(e.fecha);
      return fecha >= new Date(dateRange.startDate) && fecha <= new Date(dateRange.endDate);
    });

  const total = filtered.reduce((acc, e) => acc + e.monto, 0);

  const handleDelete = async () => {
    const { error } = await supabase
      .schema('operations')
      .from('empCost')
      .delete()
      .eq('id', toDelete);
    if (error) { sileo.error('No se pudo eliminar el registro'); return; }
    sileo.success('Registro eliminado');
    setToDelete(null);
    refresh();
  };

  return (
    <div>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen onClose={() => setShowModal(false)}>
            <AddExpenseEmployee onAdded={() => { setShowModal(false); refresh(); }} />
          </Modal>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingExpense && (
          <Modal isOpen onClose={() => setEditingExpense(null)}>
            <AddExpenseEmployee expense={editingExpense} onAdded={() => { setEditingExpense(null); refresh(); }} />
          </Modal>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar registro?"
        message="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4"
        >
          <div className="bg-slate-100 p-3 rounded-xl">
            <DollarSign className="text-slate-700" size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Pagado</p>
            <p className="text-xl font-semibold text-slate-800">₡{total.toLocaleString()}</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setView('cards')}
              className={`flex items-center gap-2 px-4 py-2 transition ${view === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutGrid size={16} /> Cards
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-2 px-4 py-2 transition ${view === 'table' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Table size={16} /> Tabla
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-md"
          >
            <Plus size={18} /> Nuevo Registro
          </motion.button>
        </div>
      </div>

      <DatePicker onChange={setDateRange} />

      <div className="relative my-6 max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
        />
      </div>

      <AnimatePresence mode="wait">
        {view === 'cards' ? (
          <motion.div key="cards" variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            {filtered.map((e) => (
              <ExpenseCard key={e.id} {...e} onEdit={setEditingExpense} onDelete={setToDelete} />
            ))}
            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 mt-12">
                No se encontraron registros.
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExpenseTable
              gastos={filtered}
              onEdit={setEditingExpense}
              onDelete={setToDelete}
              emptyMessage="No se encontraron registros de empleados."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const Bills = () => {
  const [tab, setTab] = useState('operativos');

  return (
    <motion.div
      className="min-h-screen bg-slate-50 rounded p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm p-6 mb-6"
      >
        <h1 className="text-3xl font-bold text-slate-800">Control de Gastos</h1>
        <p className="text-slate-500 mt-1">Administra los gastos operativos y de personal</p>
      </motion.div>

      {/* Tab selector */}
      <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden w-fit mb-6">
        <button
          onClick={() => setTab('operativos')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition ${tab === 'operativos' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <DollarSign size={15} />
          Gastos Operativos
        </button>
        <button
          onClick={() => setTab('personal')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition ${tab === 'personal' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Users size={15} />
          Personal
        </button>
      </div>

      {/* Tab content */}
      {tab === 'operativos' && <GastosTab />}
      {tab === 'personal' && <PersonalTab />}
    </motion.div>
  );
};

export default Bills;
