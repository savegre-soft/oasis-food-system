import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "./../components/Modal";
import Offcanvas from "./../components/Offcanvas";
import AddCustomer from "../components/AddCustomer";

export default function Customers() {
  const [clientes, setClientes] = useState([
    { id: 1, nombre: "Juan Pérez" },
    { id: 2, nombre: "María López" },
  ]);

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

      <ul className="mb-8">
        {clientes.map((c) => (
          <li key={c.id} className="p-2 bg-slate-100 mb-2 rounded">
            {c.nombre}
          </li>
        ))}
      </ul>

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