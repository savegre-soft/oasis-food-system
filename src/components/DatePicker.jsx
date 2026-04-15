import { useState } from 'react';

const DatePicker = ({ startDate, endDate, onChange }) => {
  const [mode, setMode] = useState('day');

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();

    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const handleModeChange = (value) => {
    setMode(value);

    const now = new Date();
    let start;
    let end;

    switch (value) {
      case 'day':
        start = new Date();
        start.setHours(0, 0, 0, 0);

        end = new Date();
        end.setHours(23, 59, 59, 999);

        onChange?.({ startDate: start, endDate: end });
        break;

      case 'week':
        ({ start, end } = getWeekRange(now));
        onChange?.({ startDate: start, endDate: end });
        break;

      case 'last_week':
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);

        ({ start, end } = getWeekRange(lastWeek));
        onChange?.({ startDate: start, endDate: end });
        break;

      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);

        onChange?.({ startDate: start, endDate: end });
        break;

      case 'quarter':
        const q = Math.floor(now.getMonth() / 3);

        start = new Date(now.getFullYear(), q * 3, 1);
        end = new Date(now.getFullYear(), q * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);

        onChange?.({ startDate: start, endDate: end });
        break;

      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);

        onChange?.({ startDate: start, endDate: end });
        break;

      case 'custom':
        break;
    }
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;

    onChange?.({
      startDate: new Date(customStart),
      endDate: new Date(customEnd),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-end gap-4 mb-6 shadow-sm">
      <div className="flex flex-col">
        <label className="text-sm text-slate-500 mb-1">Rango de Fecha</label>

        <select
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <option value="day">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="last_week">Semana pasada</option>
          <option value="month">Este mes</option>
          <option value="quarter">Este trimestre</option>
          <option value="year">Este año</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>

      {mode === 'custom' && (
        <>
          <div className="flex flex-col">
            <label className="text-sm text-slate-500 mb-1">Fecha inicio</label>

            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-slate-500 mb-1">Fecha fin</label>

            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            onClick={applyCustom}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition active:scale-95 text-sm font-medium"
          >
            Aplicar
          </button>
        </>
      )}
    </div>
  );
};

export default DatePicker;
