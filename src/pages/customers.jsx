import { useEffect, useState } from 'react';
import { Search, UserCheck, UserX, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AddCustomer from '../components/AddCustomer';
import CustomerCard from '../components/CustomerCard';
import CustomerDetailModal from '../components/CustomerDetailModal';
import { useApp } from '../context/AppContext';

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
};

export default function Customers() {
  const { supabase } = useApp();

  const [customers,        setCustomers]        = useState([]);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [activeTab,        setActiveTab]        = useState('active'); // 'active' | 'inactive'
  const [showModal,        setShowModal]        = useState(false);
  const [editingCustomer,  setEditingCustomer]  = useState(null);
  const [toDelete,         setToDelete]         = useState(null);
  const [toReactivate,     setToReactivate]     = useState(null);
  const [showDetail,       setShowDetail]       = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const fetchData = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('clients')
      .select(
        `
        *,
        lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey (
          id_macro_profile, name,
          protein_value, protein_unit,
          carb_value, carb_unit
        ),
        dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey (
          id_macro_profile, name,
          protein_value, protein_unit,
          carb_value, carb_unit
        )
      `)
      .eq('is_active', true)
      .order('id_client', { ascending: false });

    if (data) setCustomers(data);
    if (error) console.error('Error fetching clientes:', error);
  };

  useEffect(() => { fetchData(); }, []);

  const eliminar = async (id) => {
    const { error } = await supabase.schema('operations').from('clients')
      .update({ is_active: false }).eq('id_client', id);
    if (error) { console.error(error); return; }
    fetchData();
  };

  const reactivar = async (id) => {
    const { error } = await supabase.schema('operations').from('clients')
      .update({ is_active: true }).eq('id_client', id);
    if (error) { console.error(error); return; }
    fetchData();
  };

  const activeCustomers   = customers.filter(c => c.is_active);
  const inactiveCustomers = customers.filter(c => !c.is_active);

  const displayed = (activeTab === 'active' ? activeCustomers : inactiveCustomers)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      {/* ── Confirm delete ── */}
      <ConfirmDialog
        open={!!toDelete}
        title="¿Desactivar cliente?"
        message="El cliente quedará inactivo. Puedes reactivarlo desde la pestaña Desactivados."
        onConfirm={() => { eliminar(toDelete); setToDelete(null); }}
        onCancel={() => setToDelete(null)}
      />

      {/* Grid de clientes */}
      <motion.div
        className="grid border p-2 shadow border-gray-200 rounded grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <AnimatePresence>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((c) => (
              <motion.div
                key={c.id_client}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <CustomerCard
                  customer={c}
                  onSelected={(customer) => {
                    setSelectedCustomer(customer);
                    setShowDetail(true);
                  }}
                />
              </motion.div>
            ))
          ) : (
            <motion.p
              className="text-slate-500 col-span-full text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No se encontraron clientes.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Add modal ── */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              fetchData();
            }}
          >
            <AddCustomer
              onAdd={() => {
                setShowModal(false);
                fetchData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editingCustomer && (
          <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)}>
            <AddCustomer
              initialData={editingCustomer}
              onAdd={() => { setEditingCustomer(null); fetchData(); }}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Detail modal ── */}
      <AnimatePresence>
        {showDetail && selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            onClose={() => { setShowDetail(false); setSelectedCustomer(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Page content ── */}
      <div className="p-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Clientes</h1>
            <p className="text-slate-500 mt-1">Gestiona los clientes registrados</p>
          </div>
          <button
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm font-medium"
            onClick={() => setShowModal(true)}
          >
            + Nuevo Cliente
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 bg-white border border-slate-100 rounded-2xl p-1 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'active'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck size={15} />
            Activos
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === 'active' ? 'bg-slate-600 text-slate-200' : 'bg-slate-100 text-slate-500'
            }`}>
              {activeCustomers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'inactive'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserX size={15} />
            Desactivados
            {inactiveCustomers.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === 'inactive' ? 'bg-slate-600 text-slate-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {inactiveCustomers.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5 w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm"
          />
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {displayed.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-400">
                {activeTab === 'active'
                  ? <><UserCheck size={36} className="mx-auto mb-2 opacity-30" /><p>No hay clientes activos</p></>
                  : <><UserX size={36} className="mx-auto mb-2 opacity-30" /><p>No hay clientes desactivados</p></>
                }
              </div>
            ) : (
              displayed.map((c) => (
                <motion.div
                  key={c.id_client}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  {activeTab === 'active' ? (
                    <CustomerCard
                      customer={c}
                      onSelected={(customer) => { setSelectedCustomer(customer); setShowDetail(true); }}
                      onEdit={(customer) => setEditingCustomer(customer)}
                      onDelete={(id) => setToDelete(id)}
                    />
                  ) : (
                    <InactiveCustomerCard
                      customer={c}
                      onReactivate={(id) => setToReactivate(id)}
                    />
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

// ── Card for inactive customers ───────────────────────────────────────────────

const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family:   { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

function InactiveCustomerCard({ customer, onReactivate }) {
  const typeStyle = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 opacity-70">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-semibold text-slate-600">{customer.name}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.className}`}>
              {typeStyle.label}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              Inactivo
            </span>
          </div>
          <div className="text-sm text-slate-400 space-y-0.5">
            {customer.phone && <p>📞 {customer.phone}</p>}
            {customer.address_detail && <p className="truncate">📍 {customer.address_detail}</p>}
          </div>
          {customer.created_at && (
            <p className="text-xs text-gray-400 mt-1">
              Creado: {new Date(customer.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onReactivate(customer.id_client)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400 transition text-xs font-medium shrink-0"
        >
          <RotateCcw size={13} />
          Reactivar
        </button>
      </div>
    </div>
  );
}
