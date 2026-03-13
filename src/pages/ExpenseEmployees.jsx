import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  DollarSign,
  LayoutGrid,
  Table
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import { useApp } from '../context/AppContext';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseTable from '../components/ExpenseTable';
import DatePicker from '../components/DatePicker';
import Modal from '../components/Modal';

const ExpenseEmployees = () => {
  const { supabase } = useApp();

  const [expensesEmployees, setExpensesEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('cards');
  const [showModal, setShowModal] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  /* -----------------------------
     Obtener datos
  ----------------------------- */

  const fetchData = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('empCost')
      .select('*')
      .order('WorkDate', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const formatted = data.map((item) => ({
      id: item.id,
      descripcion: item.Name,
      categoria: `Horas: ${item.Hours}`,
      fecha: item.WorkDate,
      monto: item.Amount
    }));

    setExpensesEmployees(formatted);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* -----------------------------
     Filtros
  ----------------------------- */

  const expensesFiltered = expensesEmployees
    .filter((expense) =>
      expense.descripcion.toLowerCase().includes(search.toLowerCase())
    )
    .filter((expense) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;

      const fecha = new Date(expense.fecha);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);

      return fecha >= start && fecha <= end;
    });

  /* -----------------------------
     Total
  ----------------------------- */

  const totalExpenses = expensesFiltered.reduce(
    (acc, expense) => acc + expense.monto,
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 rounded p-8">

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
            <div className="p-6">
              Crear gasto de empleado
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Gastos de Empleados
          </h1>
          <p className="text-slate-500 mt-1">
            Administra los gastos asociados al personal
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-md transition active:scale-95"
        >
          <Plus size={18} />
          Nuevo Gasto
        </button>

      </div>

      {/* Date Picker */}
      <DatePicker onChange={setDateRange} />

      {/* Resumen */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">

        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-slate-100 p-3 rounded-xl">
            <DollarSign className="text-slate-700" size={22} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Total Pagado
            </p>
            <p className="text-xl font-semibold text-slate-800">
              ₡{totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">

          <button
            onClick={() => setView('cards')}
            className={`flex items-center gap-2 px-4 py-2 transition ${
              view === 'cards'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid size={16} />
            Cards
          </button>

          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-2 px-4 py-2 transition ${
              view === 'table'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Table size={16} />
            Tabla
          </button>

        </div>

      </div>

      {/* Buscador */}
      <div className="relative mb-8 max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-3.5 text-slate-400"
        />

        <input
          type="text"
          placeholder="Buscar empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
        />
      </div>

      {/* Vista */}
      {view === 'cards' ? (
        <div className="space-y-4 overflow-auto">

          {expensesFiltered.map((expense) => (
            <ExpenseCard key={expense.id} {...expense} />
          ))}

          {expensesFiltered.length === 0 && (
            <div className="text-center text-slate-500 mt-12">
              No se encontraron registros.
            </div>
          )}

        </div>
      ) : (
        <ExpenseTable gastos={expensesFiltered} />
      )}

    </div>
  );
};

export default ExpenseEmployees;