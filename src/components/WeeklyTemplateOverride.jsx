import { useEffect, useState } from 'react';
import { CalendarClock, RotateCcw } from 'lucide-react';
import { sileo } from 'sileo';
import { useApp } from '../context/AppContext';
import { getWeekRange, getWeekOfMonth, toDateString } from './orderUtils';

const MEAL_TYPES = [
  { key: 'Lunch', label: '☀️ Almuerzo' },
  { key: 'Dinner', label: '🌙 Cena' },
];

// Tarjeta para que el staff vea/anule qué plantilla aplica automáticamente
// el portal de clientes esta semana (RF nuevo, pedido explícito del usuario:
// "botón para cambiar la plantilla si es requerido, solo para el staff").
const WeeklyTemplateOverride = () => {
  const { supabase } = useApp();
  const [loading, setLoading] = useState(true);
  const [templatesByType, setTemplatesByType] = useState({ Lunch: [], Dinner: [] });
  const [autoByType, setAutoByType] = useState({ Lunch: null, Dinner: null });
  const [overrideByType, setOverrideByType] = useState({ Lunch: null, Dinner: null });

  const { weekStart } = getWeekRange();
  const weekOfMonth = getWeekOfMonth(weekStart);
  const weekStartStr = toDateString(weekStart);

  const fetchData = async () => {
    setLoading(true);

    const [{ data: allTemplates }, { data: autoTemplates }, { data: overrides }] = await Promise.all([
      supabase
        .schema('operations')
        .from('order_templates')
        .select('id_template, name, meal_type')
        .eq('is_active', true)
        .in('meal_type', ['Lunch', 'Dinner'])
        .order('name'),
      supabase
        .schema('operations')
        .from('order_templates')
        .select('id_template, name, meal_type')
        .eq('is_active', true)
        .eq('week_of_month', weekOfMonth)
        .in('meal_type', ['Lunch', 'Dinner']),
      supabase
        .schema('operations')
        .from('portal_template_overrides')
        .select('meal_type, template_id, order_templates(name)')
        .eq('week_start_date', weekStartStr),
    ]);

    const byType = { Lunch: [], Dinner: [] };
    (allTemplates ?? []).forEach((t) => byType[t.meal_type]?.push(t));
    setTemplatesByType(byType);

    const auto = { Lunch: null, Dinner: null };
    (autoTemplates ?? []).forEach((t) => {
      auto[t.meal_type] = t;
    });
    setAutoByType(auto);

    const ov = { Lunch: null, Dinner: null };
    (overrides ?? []).forEach((o) => {
      ov[o.meal_type] = { id_template: o.template_id, name: o.order_templates?.name };
    });
    setOverrideByType(ov);

    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartStr, weekOfMonth]);

  const handleOverride = async (mealType, templateId) => {
    if (!templateId) {
      const { error } = await supabase
        .schema('operations')
        .from('portal_template_overrides')
        .delete()
        .eq('week_start_date', weekStartStr)
        .eq('meal_type', mealType);
      if (error) {
        sileo.error('No se pudo quitar la anulación');
        return;
      }
      sileo.success('Vuelve a usar la plantilla automática');
    } else {
      const { error } = await supabase
        .schema('operations')
        .from('portal_template_overrides')
        .upsert(
          [{ week_start_date: weekStartStr, meal_type: mealType, template_id: Number(templateId) }],
          { onConflict: 'week_start_date,meal_type' }
        );
      if (error) {
        sileo.error('No se pudo anular la plantilla');
        return;
      }
      sileo.success('Plantilla de esta semana actualizada');
    }
    await fetchData();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock size={16} className="text-slate-500" />
        <h2 className="font-semibold text-slate-800">Plantilla de esta semana en el portal</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Semana {weekOfMonth} del mes (lunes {weekStartStr}). Es la plantilla que se le aplica
        automáticamente al cliente en el portal — podés anularla para esta semana puntual si hace falta.
      </p>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {MEAL_TYPES.map(({ key, label }) => {
            const effective = overrideByType[key] ?? autoByType[key];
            return (
              <div key={key} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
                <p className="text-sm text-slate-600 mb-3">
                  {effective ? (
                    <>
                      {effective.name}{' '}
                      {overrideByType[key] && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          anulada
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Sin plantilla asignada a esta semana</span>
                  )}
                </p>
                <div className="flex gap-2">
                  <select
                    value={overrideByType[key]?.id_template ?? ''}
                    onChange={(e) => handleOverride(key, e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                  >
                    <option value="">Automática (Semana {weekOfMonth})</option>
                    {templatesByType[key].map((t) => (
                      <option key={t.id_template} value={t.id_template}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {overrideByType[key] && (
                    <button
                      onClick={() => handleOverride(key, null)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg transition"
                      title="Quitar anulación"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklyTemplateOverride;
