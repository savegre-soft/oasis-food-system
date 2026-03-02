import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './../components/Modal';
import Offcanvas from './../components/Offcanvas';
import AddCustomer from '../components/AddCustomer';
import CustomerCard from '../components/CustomerCard';
import { useApp } from '../context/AppContext';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function Customers() {
  const { supabase } = useApp();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('clients')
        .select('*');

      if (data) setCustomers(data);
      if (error) console.error('Error fetching clientes:', error);
    };
    fetchData();
  }, [supabase]);

  const handleAddCliente = async (nombre) => {
    setShowModal(false);
    const { data, error } = await supabase
      .schema('operations')
      .from('clients')
      .insert([{ name: nombre }])
      .select();

    if (error) {
      console.error('Error agregando cliente:', error);
      return;
    }

    setCustomers([...customers, ...data]);
    setShowModal(false);
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Animación para los cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="p-8">
      {/* Buscador y botón nuevo cliente */}
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
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => setShowModal(true)}
        >
          Nuevo Cliente
        </button>
      </div>

      {/* Lista de clientes con motion */}
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
                key={c.id}
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

      {/* Modal para agregar cliente */}
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <AddCustomer onAdd={handleAddCliente} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Offcanvas para ver cliente seleccionado */}
      <AnimatePresence>
        {showOffcanvas && (
          <Offcanvas isOpen={showOffcanvas} onClose={() => setShowOffcanvas(false)}>
            {selectedCustomer ? (
             <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
  {/* Información básica */}
  <div className="mb-4">
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedCustomer.name}</h2>
    {selectedCustomer.phone && (
      <p className="text-sm text-gray-600 mb-1">
        <span className="font-semibold">Teléfono:</span> {selectedCustomer.phone}
      </p>
    )}
    {selectedCustomer.address_detail && (
      <p className="text-sm text-gray-600 mb-1">
        <span className="font-semibold">Dirección:</span> {selectedCustomer.address_detail}
      </p>
    )}
  </div>

  {/* Mapa con ubicación */}
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