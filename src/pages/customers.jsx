import { useEffect, useState } from 'react';
import { Search, LayoutGrid, Table } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './../components/Modal';
import AddCustomer from '../components/AddCustomer';
import CustomerCard from '../components/CustomerCard';
import CustomerDetailModal from '../components/CustomerDetail';
import CustomerTable from '../components/CustomerTable';
import { useApp } from '../context/AppContext';

const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family: { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

export default function Customers() {
  const { supabase } = useApp();

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
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
      `
      )
      .eq('is_active', true)
      .order('id_client', { ascending: false });

    if (data) setCustomers(data);
    if (error) console.error('Error fetching clientes:', error);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="p-8 border rounded bg-white border-gray-50 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Clientes</h2>

      {/* Buscador + botones */}
      <div className="flex flex-col md:flex-row gap-2 mb-4 justify-between md:items-center">
        <div className="relative border rounded border-gray-200 shadow mt-2 md:mt-0 md:ml-4 w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Cambiar vista */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'bg-white'
              }`}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg border ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'bg-white'
              }`}
            >
              <Table size={18} />
            </button>
          </div>

          <button
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm font-medium"
            onClick={() => setShowModal(true)}
          >
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Vista GRID */}
      {viewMode === 'grid' && (
        <motion.div
          className="grid  p-2  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
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
      )}

      {/* Vista TABLA */}
      {viewMode === 'table' && (
        <CustomerTable
          customers={filteredCustomers}
          onSelected={(customer) => {
            setSelectedCustomer(customer);
            setShowDetail(true);
          }}
        />
      )}

      {/* Modal agregar cliente */}
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

      {/* Modal detalle */}
      <AnimatePresence>
        {showDetail && selectedCustomer && (
          <CustomerDetailModal customer={selectedCustomer} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
