import { useEffect, useState } from 'react';
import { Plus, Search, DollarSign, LayoutGrid, Table } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useApp } from '../context/AppContext';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseTable from '../components/ExpenseTable';
import DatePicker from '../components/DatePicker';
import AddExpensive from '../components/AddExpensive';
import Modal from '../components/Modal';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Bills = () => {
  const { supabase } = useApp();

  const [gastos, setGastos] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('cards');
  const [showModal, setShowModal] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const fetchData = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const formatted = data.map((item) => ({
      id: item.id_expense,
      descripcion: item.description,
      categoria: `Categoria ${item.category_id}`,
      fecha: item.expense_date,
      monto: item.amount,
    }));

    setGastos(formatted);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const gastosFiltrados = gastos
    .filter((gasto) => gasto.descripcion.toLowerCase().includes(search.toLowerCase()))
    .filter((gasto) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;

      const fecha = new Date(gasto.fecha);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);

      return fecha >= start && fecha <= end;
    });

  const totalGastos = gastosFiltrados.reduce((acc, gasto) => acc + gasto.monto, 0);

  return (
    <motion.div
      className="min-h-screen bg-slate-100 rounded p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              fetchData();
            }}
          >
            <AddExpensive />
          </Modal>
        )}
      </AnimatePresence>

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

      {/* Resumen */}
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

        {/* Toggle */}
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
            className="space-y-4 overflow-auto"
          >
            {gastosFiltrados.map((gasto) => (
              <div key={gasto.id}>
                <ExpenseCard {...gasto} />
              </div>
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
            <ExpenseTable gastos={gastosFiltrados} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Bills;
