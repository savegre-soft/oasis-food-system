import { Trash2, Pencil } from 'lucide-react';

const DAY_LABELS = {
  Monday:    'Lun',
  Tuesday:   'Mar',
  Wednesday: 'Mié',
  Thursday:  'Jue',
  Friday:    'Vie',
  Saturday:  'Sáb',
  Sunday:    'Dom',
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_TYPE_STYLES = {
  Lunch:  { label: '☀️ Almuerzo', className: 'bg-amber-50 text-amber-700' },
  Dinner: { label: '🌙 Cena',     className: 'bg-indigo-50 text-indigo-700' },
};

const TemplateCard = ({ template, onDelete, onEdit }) => {
  const sortedDays = [...(template.order_template_days || [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week)
  );

  const mealStyle = MEAL_TYPE_STYLES[template.meal_type] ?? { label: template.meal_type, className: 'bg-slate-100 text-slate-600' };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Nombre + badge tipo */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-lg">{template.name}</p>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${mealStyle.className}`}>
              {mealStyle.label}
            </span>
          </div>

          {template.description && (
            <p className="text-sm text-slate-500 mt-0.5">{template.description}</p>
          )}

          {/* Días con recetas */}
          <div className="mt-4 flex flex-col gap-2">
            {sortedDays.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sin días configurados</p>
            ) : (
              sortedDays.map((day) => (
                <div key={day.id_template_day} className="flex items-start gap-3">
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full min-w-[40px] text-center">
                    {DAY_LABELS[day.day_of_week] ?? day.day_of_week}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {day.order_template_details?.length > 0 ? (
                      day.order_template_details.map((detail) => (
                        <span
                          key={detail.id_template_detail}
                          className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                        >
                          {detail.recipes?.name}
                          {detail.quantity > 1 && (
                            <span className="ml-1 text-blue-400">×{detail.quantity}</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sin recetas</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 mt-1 shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(template)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-400 transition">
              <Pencil size={14} />
            </button>
          )}
          <button onClick={() => onDelete(template.id_template)}
            className="p-1.5 rounded-xl border border-slate-200 text-red-400 hover:text-red-600 hover:border-red-300 transition">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
