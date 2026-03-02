import { useState } from 'react';
import { Search, CheckCircle, Clock, Calendar, List, Table, MapPin } from 'lucide-react';

const Deliveries = () => {
  const [search, setSearch] = useState('');
  const [vista, setVista] = useState('lista');

  const entregas = [
    {
      id: 1,
      cliente: 'Juan Pérez',
      ruta: 'Ciudad Quesada',
      tipoPlan: 'Almuerzo + Cena',
      diaEntrega: 'Domingo',
      estado: 'Pendiente',
      fecha: '2026-02-22',
    },
    {
      id: 2,
      cliente: 'María López',
      ruta: 'Fortuna',
      tipoPlan: 'Solo Almuerzo',
      diaEntrega: 'Domingo',
      estado: 'En camino',
      fecha: '2026-02-22',
    },
    {
      id: 3,
      cliente: 'Carlos Ramírez',
      ruta: 'Ciudad Quesada',
      tipoPlan: 'Almuerzo + Cena',
      diaEntrega: 'Martes',
      estado: 'Entregado',
      fecha: '2026-02-21',
    },
  ];

  const entregasFiltradas = entregas.filter((e) =>
    e.cliente.toLowerCase().includes(search.toLowerCase())
  );

  const pendientes = entregas.filter((e) => e.estado === 'Pendiente').length;
  const entregadas = entregas.filter((e) => e.estado === 'Entregado').length;

  const estadoColor = (estado) => {
    if (estado === 'Pendiente') return 'bg-amber-100 text-amber-700';
    if (estado === 'En camino') return 'bg-blue-100 text-blue-700';
    if (estado === 'Entregado') return 'bg-emerald-100 text-emerald-700';
  };

  const rutaColor = (ruta) =>
    ruta === 'Fortuna' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700';

  const planColor = (plan) =>
    plan === 'Solo Almuerzo' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700';

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">Ruta Ciudad Quesada / Fortuna</h1>
        <p className="text-slate-500 mt-2">Gestión de entregas por tipo de plan y día</p>
      </div>

      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex items-center gap-4">
          <Clock className="text-amber-500" />
          <div>
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="text-2xl font-semibold text-slate-800">{pendientes}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex items-center gap-4">
          <CheckCircle className="text-emerald-500" />
          <div>
            <p className="text-sm text-slate-500">Entregadas</p>
            <p className="text-2xl font-semibold text-slate-800">{entregadas}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-200 p-1 rounded-xl w-fit mb-8">
        {[
          { id: 'lista', label: 'Lista', icon: List },
          { id: 'tabla', label: 'Tabla', icon: Table },
          { id: 'calendario', label: 'Calendario', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVista(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              vista === tab.id
                ? 'bg-white shadow text-slate-800'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-300 outline-none"
        />
      </div>

      {/* ================= LISTA ================= */}
      {vista === 'lista' && (
        <div className="space-y-4">
          {entregasFiltradas.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-800 text-lg">{e.cliente}</h2>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${rutaColor(e.ruta)}`}
                    >
                      <MapPin size={12} className="inline mr-1" />
                      {e.ruta}
                    </span>

                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${planColor(e.tipoPlan)}`}
                    >
                      {e.tipoPlan}
                    </span>

                    <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
                      {e.diaEntrega}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-4 py-1 h-fit rounded-full text-sm font-medium ${estadoColor(e.estado)}`}
                >
                  {e.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TABLA ================= */}
      {vista === 'tabla' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 text-left">Cliente</th>
                <th className="px-6 py-4 text-left">Ruta</th>
                <th className="px-6 py-4 text-left">Plan</th>
                <th className="px-6 py-4 text-left">Día</th>
                <th className="px-6 py-4 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {entregasFiltradas.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-800">{e.cliente}</td>
                  <td className="px-6 py-4">{e.ruta}</td>
                  <td className="px-6 py-4">{e.tipoPlan}</td>
                  <td className="px-6 py-4">{e.diaEntrega}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(e.estado)}`}
                    >
                      {e.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= CALENDARIO ================= */}
      {vista === 'calendario' && (
        <div className="grid grid-cols-7 gap-4">
          {entregasFiltradas.map((e) => (
            <div
              key={e.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition"
            >
              <p className="text-xs text-slate-400">{e.fecha}</p>
              <p className="font-semibold text-slate-800 mt-1">{e.cliente}</p>
              <p className="text-xs text-slate-500 mt-1">{e.ruta}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Deliveries;
