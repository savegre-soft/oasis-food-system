import { useEffect, useState } from 'react';
import DatePicker from '../components/DatePicker';
import { DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5f5'];

const ExpenseStadistic = () => {

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const lineData = [
    { date: '01 Jun', total: 12000 },
    { date: '02 Jun', total: 8000 },
    { date: '03 Jun', total: 15000 },
    { date: '04 Jun', total: 5000 },
    { date: '05 Jun', total: 20000 },
  ];

  const pieData = [
    { name: 'Gasolina', value: 40000 },
    { name: 'Comida', value: 25000 },
    { name: 'Servicios', value: 15000 },
    { name: 'Otros', value: 10000 },
  ];

  const totalExpenses = lineData.reduce((acc, item) => acc + item.total, 0);

  return (
    <section>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Estadística de Gastos</h1>
          <p className="text-slate-500 mt-1">Analiza los gastos de tu negocio</p>
        </div>
      </div>

      {/* Date Picker */}
      <DatePicker onChange={setDateRange} />

      <hr className="my-8" />

      <div>
        <h2>Gastos</h2>
        {/* Tarjeta total */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4 w-fit">
            <div className="bg-slate-100 p-3 rounded-xl">
              <DollarSign className="text-slate-700" size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Total Gastado</p>
              <p className="text-xl font-semibold text-slate-800">
                ₡{totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Graficas */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Gráfica lineal */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Gastos por Día</h3>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica de pastel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Gastos por Categoría</h3>

            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div>
        <h2>Gastos Pago Personal</h2>
        {/* Tarjeta total */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4 w-fit">
            <div className="bg-slate-100 p-3 rounded-xl">
              <DollarSign className="text-slate-700" size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Total Gastado</p>
              <p className="text-xl font-semibold text-slate-800">
                ₡{totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Graficas */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Gráfica lineal */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Gastos por Día</h3>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica de pastel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Gastos por Categoría</h3>

            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpenseStadistic;
