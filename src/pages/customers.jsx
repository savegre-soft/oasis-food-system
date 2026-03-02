import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Modal from './../components/Modal';
import Offcanvas from './../components/Offcanvas';
import AddCustomer from '../components/AddCustomer';
import CustomerCard from '../components/CustomerCard';
import { useApp } from '../context/AppContext';

/**
 * Componente principal para administrar clientes.
 * Permite listar clientes, buscarlos, y abrir formularios para agregar nuevos
 * clientes mediante Modal o Offcanvas.
 *
 * @component
 * @example
 * return <Customers />
 */
export default function Customers() {
  const { supabase } = useApp();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  // Carga inicial de clientes desde Supabase
  useEffect(() => {
    const GetData = async () => {
      const { data, error } = await supabase.schema('operations').from('clients').select('*');

      if (data) setCustomers(data);
      if (error) console.error('Error fetching clientes:', error);
    };
    GetData();
  }, [supabase]);

  /**
   * Maneja la adición de un nuevo cliente
   * @param {string} nombre - Nombre del cliente
   */
  const handleAddCliente = (nombre) => {
    const GetData = async () => {
      const { data, error } = await supabase.schema('operations').from('clients').select('*');

      if (data) setCustomers(data);
      if (error) console.error('Error fetching clientes:', error);
    };
    GetData();
  setShowModal(false);
  };

  // Filtrar clientes según término de búsqueda
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* 🔹 Botones para abrir Modal y Offcanvas */}
      <div className="flex  flex-col md:flex-row gap-2 mb-4  justify-between md:items-center">
        {/* 🔹 Buscador */}
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
          className="bg-blue-600 rounded text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => setShowModal(true)}
        >
          Nuevo Cliente
        </button>
      </div>

      {/* 🔹 Lista de clientes filtrados */}
      <div className="grid border p-2 shadow border-gray-200 rounded grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((c) => <CustomerCard key={c.id} customer={c} />)
        ) : (
          <p className="text-slate-500 col-span-full text-center mt-4">
            No se encontraron clientes.
          </p>
        )}
      </div>

      {/* 🔹 Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <AddCustomer onAdd={handleAddCliente} />
      </Modal>

      {/* 🔹 Offcanvas */}
      <Offcanvas isOpen={showOffcanvas} onClose={() => setShowOffcanvas(false)}>
        <AddCustomer onAdd={handleAddCliente} />
      </Offcanvas>
    </div>
  );
}
