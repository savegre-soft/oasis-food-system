import { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Pencil, Trash2, ChevronDown, ChevronUp, Clock, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sileo } from 'sileo';

import { useApp } from '../context/AppContext';
import AddExpenseEmployee from '../components/AddExpenseEmployee';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import DatePicker from '../components/DatePicker';
import AuthRoles from '../components/auth/AuthRoles';

// ── PayrollCard ───────────────────────────────────────────────────────────────

const PayrollCard = ({ record, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const deductions = record.emp_cost_deductions ?? [];
  const totalDed = deductions.reduce((s, d) => s + Number(d.amount), 0);
  const net = Number(record.Amount) - totalDed;

  const fecha = new Date(record.WorkDate + 'T00:00:00').toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const unitLabel =
    record.payment_type === 'days'
      ? `${record.Hours} ${Number(record.Hours) === 1 ? 'día' : 'días'}`
      : `${record.Hours} ${Number(record.Hours) === 1 ? 'hora' : 'horas'}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
            {record.Name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{record.Name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-400">{fecha}</span>
              <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {record.payment_type === 'days' ? <Calendar size={11} /> : <Clock size={11} />}
                {unitLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Amounts */}
        <div className="text-right shrink-0">
          {deductions.length > 0 ? (
            <>
              <p className="text-xs text-slate-400 line-through">₡{Number(record.Amount).toLocaleString()}</p>
              <p className="text-base font-bold text-slate-800">₡{net.toLocaleString()}</p>
              <p className="text-xs text-red-500">-₡{totalDed.toLocaleString()} ded.</p>
            </>
          ) : (
            <p className="text-base font-bold text-slate-800">₡{Number(record.Amount).toLocaleString()}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {deductions.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition rounded-lg"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition rounded-lg"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-red-400 hover:text-red-600 transition rounded-lg"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Deductions breakdown */}
      {expanded && deductions.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deducciones</p>
          {deductions.map((d) => (
            <div key={d.id} className="flex justify-between text-sm">
              <span className="text-slate-600">{d.description}</span>
              <span className="text-red-500 font-medium">-₡{Number(d.amount).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-2 mt-1">
            <span>Neto pagado</span>
            <span>₡{net.toLocaleString()}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color }) => {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-700',
  };
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4"
    >
      <div className={`p-3 rounded-xl ${colors[color] ?? colors.slate}`}>
        <DollarSign size={20} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-800">₡{value.toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const Planilla = () => {
  const { supabase } = useApp();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('empCost')
        .select('*, emp_cost_deductions(*)')
        .order('WorkDate', { ascending: false });
      if (error) { console.error(error); return; }
      setRecords(data ?? []);
    })();
  }, [supabase, refreshKey]);

  const filtered = records
    .filter((r) => r.Name.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const d = new Date(r.WorkDate);
      return d >= new Date(dateRange.startDate) && d <= new Date(dateRange.endDate);
    });

  const totalBruto = filtered.reduce((s, r) => s + Number(r.Amount), 0);
  const totalDeducciones = filtered.reduce(
    (s, r) => s + (r.emp_cost_deductions ?? []).reduce((sd, d) => sd + Number(d.amount), 0),
    0
  );
  const totalNeto = totalBruto - totalDeducciones;

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
    <AuthRoles rolesNames={['Finanzas', 'Administrador']}>
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
          <h1 className="text-3xl font-bold text-slate-800">Planilla</h1>
          <p className="text-slate-500 mt-1">Gestión de pagos y deducciones de personal</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Bruto" value={totalBruto} color="slate" />
          <StatCard label="Deducciones" value={totalDeducciones} color="red" />
          <StatCard label="Neto a Pagar" value={totalNeto} color="green" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <DatePicker onChange={setDateRange} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-md"
          >
            <Plus size={18} /> Nuevo Pago
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar empleado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
          />
        </div>

        {/* Records */}
        <div className="space-y-3">
          {filtered.map((record) => (
            <PayrollCard
              key={record.id}
              record={record}
              onEdit={() => setEditingRecord(record)}
              onDelete={() => setToDelete(record.id)}
            />
          ))}
          {filtered.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-slate-400 mt-12"
            >
              No se encontraron registros.
            </motion.p>
          )}
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showModal && (
            <Modal isOpen onClose={() => setShowModal(false)}>
              <AddExpenseEmployee
                onAdded={() => {
                  setShowModal(false);
                  refresh();
                }}
              />
            </Modal>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {editingRecord && (
            <Modal isOpen onClose={() => setEditingRecord(null)}>
              <AddExpenseEmployee
                expense={editingRecord}
                onAdded={() => {
                  setEditingRecord(null);
                  refresh();
                }}
              />
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
      </motion.div>
    </AuthRoles>
  );
};

export default Planilla;
