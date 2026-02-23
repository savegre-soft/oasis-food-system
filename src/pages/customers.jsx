import { useState } from "react";
import { Search, Plus, Phone, Mail, MapPin, Users } from "lucide-react";

const Customers = () => {
  const [search, setSearch] = useState("");

  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: "Juan Pérez",
      telefono: "8888-8888",
      correo: "juan@email.com",
      direccion: "San José",
    },
    {
      id: 2,
      nombre: "María López",
      telefono: "7777-7777",
      correo: "maria@email.com",
      direccion: "Heredia",
    },
  ]);

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className=" bg-slate-100 rounded p-8">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Clientes
          </h1>
          <p className="text-slate-500 mt-1">
            Administra y gestiona tus clientes
          </p>
        </div>

        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 active:scale-95">
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-3.5 text-slate-400"
        />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition"
        />
      </div>

      {/* Stats */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4 w-fit">
          <div className="bg-slate-100 p-3 rounded-xl">
            <Users className="text-slate-700" size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Clientes</p>
            <p className="text-xl font-semibold text-slate-800">
              {clientes.length}
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clientesFiltrados.map((cliente) => (
          <div
            key={cliente.id}
            className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100"
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-4 group-hover:text-slate-900">
              {cliente.nombre}
            </h2>

            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                {cliente.telefono}
              </p>

              <p className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                {cliente.correo}
              </p>

              <p className="flex items-center gap-3">
                <MapPin size={16} className="text-slate-400" />
                {cliente.direccion}
              </p>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button className="text-sm text-slate-500 hover:text-slate-900 transition">
                Editar
              </button>

              <button className="text-sm text-red-500 hover:text-red-600 transition">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="text-center text-slate-500 mt-12">
          No se encontraron clientes.
        </div>
      )}
    </div>
  );
};

export default Customers;