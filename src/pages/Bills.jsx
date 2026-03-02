import { useState } from 'react';
import { Plus, Search, Receipt, Calendar, Tag, DollarSign } from 'lucide-react';

const Bills = () => {
  const [search, setSearch] = useState('');

  const [gastos, setGastos] = useState([
    {
      id: 1,
      descripcion: 'Compra de ingredientes',
      categoria: 'Insumos',
      fecha: '2026-02-20',
      monto: 45000,
    },
    {
      id: 2,
      descripcion: 'Pago de electricidad',
      categoria: 'Servicios',
      fecha: '2026-02-18',
      monto: 32000,
    },
  ]);

  const gastosFiltrados = gastos.filter((gasto) =>
    gasto.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  const totalGastos = gastos.reduce((acc, gasto) => acc + gasto.monto, 0);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Control de Gastos</h1>
          <p className="text-slate-500 mt-1">Administra los gastos de tu negocio</p>
        </div>

        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-md transition active:scale-95">
          <Plus size={18} />
          Nuevo Gasto
        </button>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex items-center gap-4 w-fit">
        <div className="bg-slate-100 p-3 rounded-xl">
          <DollarSign className="text-slate-700" size={22} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Total Gastado</p>
          <p className="text-xl font-semibold text-slate-800">₡{totalGastos.toLocaleString()}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-8 max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar gasto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
        />
      </div>

      {/* Lista de gastos */}
      <div className="space-y-4">
        {gastosFiltrados.map((gasto) => (
          <div
            key={gasto.id}
            className="bg-white rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-100 hover:shadow-md transition"
          >
            <div>
              <h2 className="font-semibold text-slate-800">{gasto.descripcion}</h2>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                <span className="flex items-center gap-2">
                  <Tag size={14} />
                  {gasto.categoria}
                </span>

                <span className="flex items-center gap-2">
                  <Calendar size={14} />
                  {gasto.fecha}
                </span>
              </div>
            </div>

            <div className="text-lg font-semibold text-red-500">
              ₡{gasto.monto.toLocaleString()}
            </div>
          </div>
        ))}

        {gastosFiltrados.length === 0 && (
          <div className="text-center text-slate-500 mt-12">No se encontraron gastos.</div>
        )}
      </div>
    </div>
  );
};

export default Bills;
