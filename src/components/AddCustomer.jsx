import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CustomerCard from './CustomerCard'; // tu componente de tarjeta

const Customers = ({ onAdd }) => {
  const { supabase } = useApp();
  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Agregar nuevo cliente
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre) return;

    const { data, error } = await supabase
      .schema('operations')
      .from('clients') // usa schema si aplica: .from("operations.clients")
      .insert([
        {
          id: 0, // Supabase autogenerará el ID, pero lo incluimos para evitar errores de tipo
          name: nombre,
          phone,
          address_detail: address,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Error agregando cliente:', error);
      setErrorMsg(error.message);
    } else {
      setClientes([...clientes, ...data]);
      setNombre('');
      setPhone('');
      setAddress('');
      setErrorMsg('');
      if (onAdd) onAdd(data); // callback externo opcional
    }
  };

  return (
    <div className="p-8 bg-slate-100 ">
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mb-8">
        {errorMsg && <p className="text-red-500">{errorMsg}</p>}

        <input
          type="text"
          placeholder="Nombre del cliente"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          required
        />

        <input
          type="text"
          placeholder="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />

        <input
          type="text"
          placeholder="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
