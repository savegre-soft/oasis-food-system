import { useState } from "react";
import { sileo } from "sileo";
import { useApp } from "../context/AppContext";

const Customers = ({ onAdd }) => {
    const { supabase } = useApp();
  const [nombre, setNombre] = useState("");
  const [clientes, setClientes] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre) return;
    setClientes([...clientes, { id: clientes.length + 1, nombre }]);
    setNombre("");
  };

  return (
    <div className="p-8 bg-slate-100 ">
      <h1 className="text-2xl font-bold mb-6">Agregar Cliente</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <input
          type="text"
          placeholder="Nombre del cliente"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Agregar
        </button>
      </form>
    </div>
  );
};

export default Customers;
