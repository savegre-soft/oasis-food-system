import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Modal from "./../components/Modal";
import Offcanvas from "./../components/Offcanvas";
import AddCustomer from "../components/AddCustomer";
import CustomerCard from "../components/CustomerCard";
import { useApp } from "../context/AppContext"

export default function Customers() {
  const { supabase } = useApp();
  const [customers, setCustomers] = useState([]);
  
  useEffect(() => {
    const GetData = async () => {

      const {data, error} = await supabase.schema("operations").from("clients").select("*");
      if (data) { 
               setCustomers(data);
      }
      if (error) {
        console.error("Error fetching clientes:", error);
      }
    };
    GetData();
  }, []);





  const [showModal, setShowModal] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const handleAddCliente = (nombre) => {
    setClientes([...clientes, { id: clientes.length + 1, nombre }]);
    setShowModal(false);
    setShowOffcanvas(false);
  };

  return (
    <div className="p-8">
      <div className="flex gap-2 mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setShowModal(true)}
        >
          Nuevo Cliente (Modal)
        </button>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => setShowOffcanvas(true)}
        >
          Nuevo Cliente (Offcanvas)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {customers.map((c) => (
          <CustomerCard key={c.id} customer={c} />
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <AddCustomer onAdd={handleAddCliente} />
      </Modal>

      {/* Offcanvas */}
      <Offcanvas isOpen={showOffcanvas} onClose={() => setShowOffcanvas(false)}>
        <AddCustomer onAdd={handleAddCliente} />
      </Offcanvas>
    </div>
  );
}
