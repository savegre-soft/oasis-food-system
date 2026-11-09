import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Día de corte: convención de Postgres extract(dow) -- 0=domingo..6=sábado.
const CUTOFF_DAY_OPTIONS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

// Administra operations.portal_settings (fila única, id=1): el día y la hora
// de corte a partir de los cuales el portal de clientes (CustomerPortal.jsx)
// deja de aceptar cambios al pedido de la semana siguiente. No aplica al
// caso especial de entrega del martes (ver portal_submit_order), que no
// tiene corte semanal.
const PortalSettings = () => {
  const { supabase } = useApp();
  const [cutoffDay, setCutoffDay] = useState(5);
  const [cutoffTime, setCutoffTime] = useState('23:59');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('portal_settings')
      .select('order_cutoff_day_of_week, order_cutoff_time')
      .eq('id', 1)
      .maybeSingle();
    if (error) console.error(error);
    if (data?.order_cutoff_day_of_week !== undefined && data?.order_cutoff_day_of_week !== null) {
      setCutoffDay(data.order_cutoff_day_of_week);
    }
    if (data?.order_cutoff_time) setCutoffTime(data.order_cutoff_time.slice(0, 5));
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchSettings(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .schema('operations')
      .from('portal_settings')
      .update({
        order_cutoff_day_of_week: cutoffDay,
        order_cutoff_time: cutoffTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    setSaving(false);
    if (error) {
      sileo.error('No se pudo guardar el corte del portal');
      console.error(error);
      return;
    }
    sileo.success('Corte del portal actualizado');
  };

  if (loading) return <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="mb-5 flex items-start gap-3">
          <Clock size={18} className="shrink-0 mt-0.5 text-slate-500 dark:text-slate-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200">
              Corte del portal de pedidos
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Pasado este día y hora, el enlace del portal deja de aceptar pedidos nuevos o
              cambios para la semana siguiente. No afecta el caso especial de entrega del martes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Día de corte
            </label>
            <select
              value={cutoffDay}
              onChange={(e) => setCutoffDay(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
            >
              {CUTOFF_DAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Hora de corte
            </label>
            <input
              type="time"
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalSettings;
