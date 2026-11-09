import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Administra operations.portal_settings (fila única, id=1): la hora de
// corte de los viernes a partir de la cual el portal de clientes
// (CustomerPortal.jsx) deja de aceptar cambios al pedido de la semana
// siguiente. No aplica al caso especial de entrega del martes (ver
// portal_submit_order), que no tiene corte de viernes.
const PortalSettings = () => {
  const { supabase } = useApp();
  const [cutoffTime, setCutoffTime] = useState('23:59');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('portal_settings')
      .select('order_cutoff_time')
      .eq('id', 1)
      .maybeSingle();
    if (error) console.error(error);
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
      .update({ order_cutoff_time: cutoffTime, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);
    if (error) {
      sileo.error('No se pudo guardar la hora de corte');
      console.error(error);
      return;
    }
    sileo.success('Hora de corte actualizada');
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
              Pasada esta hora el viernes, el enlace del portal deja de aceptar pedidos nuevos o
              cambios para la semana siguiente. No afecta el caso especial de entrega del martes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Hora de corte (viernes)
          </label>
          <input
            type="time"
            value={cutoffTime}
            onChange={(e) => setCutoffTime(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
          />
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
