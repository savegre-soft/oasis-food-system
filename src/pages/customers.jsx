import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './../components/Modal';
import Offcanvas from './../components/Offcanvas';
import AddCustomer from '../components/AddCustomer';
import CustomerCard from '../components/CustomerCard';
import { useApp } from '../context/AppContext';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family:   { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

export default function Customers() {
  const { supabase } = useApp();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchData = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('clients')
      .select(`
        *,
        macro_profiles!fk_clients_macro (
          id_macro_profile,
          name,
          protein_value,
          protein_unit,
          carb_value,
          carb_unit
        )
      `)
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
    <div className="p-8">
      {/* Buscador y botón */}
      <div className="flex flex-col md:flex-row gap-2 mb-4 justify-between md:items-center">
        <div className="relative border rounded border-gray-200 shadow mt-2 md:mt-0 md:ml-4 w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 transition"
          />
        </div>
        <button
          className="bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm font-medium"
          onClick={() => setShowModal(true)}
        >
          Nuevo Cliente
        </button>
      </div>

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
                    setShowOffcanvas(true);
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

      {/* Modal agregar cliente */}
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => { setShowModal(false); fetchData(); }}>
            <AddCustomer onAdd={() => { setShowModal(false); fetchData(); }} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Offcanvas detalle cliente */}
      <AnimatePresence>
        {showOffcanvas && (
          <Offcanvas isOpen={showOffcanvas} onClose={() => setShowOffcanvas(false)}>
            {selectedCustomer ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
                {/* Nombre + badges */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      selectedCustomer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {selectedCustomer.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {(() => {
                      const ts = CLIENT_TYPE[selectedCustomer.client_type] ?? CLIENT_TYPE.personal;
                      return (
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ts.className}`}>
                          {ts.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Día de entrega según tipo */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Días de entrega
                  </p>
                  <p className="text-sm text-slate-700">
                    {selectedCustomer.client_type === 'family'
                      ? '📅 Viernes'
                      : '📅 Dom + Mar / Dom + Mié según pedido'}
                  </p>
                </div>

                {/* Info básica */}
                <div className="space-y-1 mb-4">
                  {selectedCustomer.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Teléfono:</span> {selectedCustomer.phone}
                    </p>
                  )}
                  {selectedCustomer.address_detail && (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Dirección:</span> {selectedCustomer.address_detail}
                    </p>
                  )}
                </div>

                {/* Macro profile */}
                {selectedCustomer.macro_profiles && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Perfil Nutricional
                    </p>
                    <p className="text-sm font-medium text-slate-800 mb-1">
                      {selectedCustomer.macro_profiles.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      Proteína: {selectedCustomer.macro_profiles.protein_value} {selectedCustomer.macro_profiles.protein_unit}
                    </p>
                    <p className="text-sm text-slate-600">
                      Carbohidratos: {selectedCustomer.macro_profiles.carb_value} {selectedCustomer.macro_profiles.carb_unit}
                    </p>
                  </div>
                )}

                {/* Mapa */}
                {selectedCustomer.latitude && selectedCustomer.longitude && (
                  <div className="mt-4 rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <MapContainer
                      center={[selectedCustomer.latitude, selectedCustomer.longitude]}
                      zoom={15}
                      style={{ height: '250px', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedCustomer.latitude, selectedCustomer.longitude]} />
                    </MapContainer>
                    <p className="mt-2 text-sm text-gray-500 text-center">
                      Lat: {selectedCustomer.latitude.toFixed(6)}, Lng: {selectedCustomer.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="p-4 text-slate-500">No hay cliente seleccionado</p>
            )}
          </Offcanvas>
        )}
      </AnimatePresence>
    </div>
  );
}