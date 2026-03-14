import { useState } from "react";
import DatePicker from "../components/DatePicker";
import { DollarSign } from "lucide-react";
import { useExpenseStatistics } from "../hooks/useExpenseStatistics";

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
} from "recharts";

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5f5"];

const ExpenseStadistic = () => {

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const {
    lineData,
    employeeLineData,
    pieData,
    totalExpenses,
    totalEmployeeCost,
    expenseCount,
    employeeCount,
  } = useExpenseStatistics(dateRange);

  return (
    <section>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Estadística de Gastos
        </h1>
      </div>

      <DatePicker onChange={setDateRange} />

      <hr className="my-8" />

      <h2 className="text-xl font-semibold mb-6">Gastos</h2>

      <div className="flex gap-6 mb-8 flex-wrap">

        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <DollarSign size={22} />
          <div>
            <p className="text-sm text-slate-500">Total Gastado</p>
            <p className="text-xl font-semibold">
              ₡{totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <DollarSign size={22} />
          <div>
            <p className="text-sm text-slate-500">Cantidad de Registros</p>
            <p className="text-xl font-semibold">{expenseCount}</p>
          </div>
        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="mb-4 font-semibold">Gastos por Día</h3>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" stroke="#0f172a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="mb-4 font-semibold">Gastos por Categoría</h3>

          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110}>
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

      <h2 className="text-xl font-semibold mb-6">Pago Personal</h2>

      <div className="flex gap-6 mb-8 flex-wrap">

        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <DollarSign size={22} />
          <div>
            <p className="text-sm text-slate-500">Total Pagado</p>
            <p className="text-xl font-semibold">
              ₡{totalEmployeeCost.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <DollarSign size={22} />
          <div>
            <p className="text-sm text-slate-500">Cantidad de Registros</p>
            <p className="text-xl font-semibold">{employeeCount}</p>
          </div>
        </div>

      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">

        <h3 className="mb-4 font-semibold">Pagos por Día</h3>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={employeeLineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line dataKey="total" stroke="#334155" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>

      </div>

    </section>
  );
};

export default ExpenseStadistic;
