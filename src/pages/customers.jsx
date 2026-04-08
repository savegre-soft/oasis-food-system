import { Search, UserCheck, UserX, RotateCcw, LayoutGrid, Table } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InactiveCustomerCard from '../components/customer/InactiveCustomerCard';

import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AddCustomer from '../components/AddCustomer';
import CustomerCard from '../components/CustomerCard';
import CustomerDetailModal from '../components/CustomerDetailModal';
import CustomerTable from '../components/CustomerTable';

import useCustomerFilters from '../hooks/useCustomerFilters';

import useCustomers from '../hooks/useCustomers';
import useCustomerUI from '../hooks/useCustomerUI';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function Customers() {
  // ── Data hook ─────────────────────────────
  const { customers, eliminar, reactivar, fetchCustomers } = useCustomers();

  // ── Filters hook ──────────────────────────
  const {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    activeCustomers,
    inactiveCustomers,
    displayed,
  } = useCustomerFilters(customers);

  // ── UI hook ───────────────────────────────
  const {
    viewSelector,
    setViewSelector,
    showModal,
    setShowModal,
    editingCustomer,
    setEditingCustomer,
    selectedCustomer,
    setSelectedCustomer,
    showDetail,
    setShowDetail,
    toDelete,
    setToDelete,
    toReactivate,
    setToReactivate,
  } = useCustomerUI();

  return (
    <>
      {/* Confirm delete */}
      <ConfirmDialog
        open={!!toDelete}
        title="¿Desactivar cliente?"
        message="El cliente quedará inactivo. Puedes reactivarlo desde la pestaña Desactivados."
        onConfirm={() => {
          eliminar(toDelete);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />

      {/* Confirm reactivate */}
      <ConfirmDialog
        open={!!toReactivate}
        title="¿Reactivar cliente?"
        confirmLabel="Reactivar"
        confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
        message="El cliente volverá a aparecer en la lista de activos."
        onConfirm={() => {
          reactivar(toReactivate);
          setToReactivate(null);
        }}
        onCancel={() => setToReactivate(null)}
      />

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              fetchCustomers();
            }}
          >
            <AddCustomer
              onAdd={() => {
                setShowModal(false);
                fetchCustomers();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingCustomer && (
          <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)}>
            <AddCustomer
              initialData={editingCustomer}
              onAdd={() => {
                setEditingCustomer(null);
                fetchCustomers();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {showDetail && selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            onClose={() => {
              setShowDetail(false);
              setSelectedCustomer(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="p-8 bg-white rounded ">
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

        <div className="flex flex-row justify-between w-full">
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
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === 'active'
                    ? 'bg-slate-600 text-slate-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
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
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === 'inactive'
                      ? 'bg-slate-600 text-slate-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {inactiveCustomers.length}
                </span>
              )}
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 mb-5 bg-white border border-slate-100 rounded-2xl p-1 w-fit shadow-sm">
            <button
              onClick={() => setViewSelector('grid')}
              className={`p-2 ${
                viewSelector === 'grid' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'
              }`}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => setViewSelector('table')}
              className={`p-2 ${
                viewSelector === 'table' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'
              }`}
            >
              <Table size={18} />
            </button>
          </div>
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
        <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* View */}
        {viewSelector === 'table' ? (
          <CustomerTable
            customers={displayed}
            onSelected={(customer) => {
              setSelectedCustomer(customer);
              setShowDetail(true);
            }}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {displayed.map((c) => (
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
                    onEdit={
                      activeTab === 'inactive'
                        ? undefined
                        : (customer) => setEditingCustomer(customer)
                    }
                    onDelete={activeTab === 'inactive' ? undefined : (id) => setToDelete(id)}
                    onReactivate={
                      activeTab === 'inactive' ? (id) => setToReactivate(id) : undefined
                    }
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
}




