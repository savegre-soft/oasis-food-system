import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { sileo } from 'sileo';

const DAYS = [
  { value: 'Monday', label: 'Lunes' },
  { value: 'Tuesday', label: 'Martes' },
  { value: 'Wednesday', label: 'Miércoles' },
  { value: 'Thursday', label: 'Jueves' },
  { value: 'Friday', label: 'Viernes' },
  { value: 'Saturday', label: 'Sábado' },
  { value: 'Sunday', label: 'Domingo' },
];

const STEP_LABELS = ['Información', 'Recetas'];

const AddTemplate = ({ onSuccess, initialData }) => {
  const { supabase } = useApp();
  const isEdit = !!initialData;

  const buildInitialDayRecipes = () => {
    if (!initialData?.order_template_days) return {};
    const result = {};
    for (const day of initialData.order_template_days) {
      result[day.day_of_week] = (day.order_template_details ?? []).map((d) => ({
        recipe_id: Number(d.recipe_id ?? d.recipes?.id_recipe ?? 0) || '',
        quantity: d.quantity ?? 1,
      }));
    }
    return result;
  };

  const [step, setStep] = useState(isEdit ? 2 : 1); // skip to step 2 when editing
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [mealType, setMealType] = useState(initialData?.meal_type ?? 'Lunch');
  const [dayRecipes, setDayRecipes] = useState(buildInitialDayRecipes());
  const [recipes, setRecipes] = useState([]);

  // ── Cargar recetas filtradas por tipo de comida ──
  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .schema('operations')
        .from('recipes')
        .select('id_recipe, name')
        .eq('is_active', true)
        .order('name');

      if (!error) setRecipes(data ?? []);
    };
    fetchRecipes();
  }, []);

  // ── Helpers recetas por día ──
  const addRecipeToDay = (day) => {
    setDayRecipes((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { recipe_id: '', quantity: 1 }],
    }));
  };

  const updateRecipeInDay = (day, index, field, value) => {
    setDayRecipes((prev) => {
      const updated = [...(prev[day] || [])];
      updated[index] = {
        ...updated[index],
        [field]: field === 'recipe_id' ? Number(value) : value,
      };
      return { ...prev, [day]: updated };
    });
  };

  const removeRecipeFromDay = (day, index) => {
    setDayRecipes((prev) => {
      const updated = [...(prev[day] || [])];
      updated.splice(index, 1);
      return { ...prev, [day]: updated };
    });
  };

  // ── Navegación ──
  const canGoNext = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  // ── Guardar ──
  const handleSubmit = async () => {
    setLoading(true);

    let templateId;
    if (isEdit) {
      const { error } = await supabase
        .schema('operations')
        .from('order_templates')
        .update({ name, description, meal_type: mealType })
        .eq('id_template', initialData.id_template);
      if (error) {
        sileo.error('Error al actualizar la plantilla');
        console.error(error);
        setLoading(false);
        return;
      }
      // Delete existing days+details (cascade)
      await supabase
        .schema('operations')
        .from('order_template_days')
        .delete()
        .eq('template_id', initialData.id_template);
      templateId = initialData.id_template;
    } else {
      const { data, error } = await supabase
        .schema('operations')
        .from('order_templates')
        .insert([{ name, description, meal_type: mealType, is_active: true }])
        .select('id_template')
        .single();
      if (error) {
        sileo.error('Error al crear la plantilla');
        console.error(error);
        setLoading(false);
        return;
      }
      templateId = data.id_template;
    }

    const daysWithRecipes = DAYS.filter((d) =>
      (dayRecipes[d.value] || []).some((r) => r.recipe_id)
    );

    for (const day of daysWithRecipes) {
      const { data: dayData, error: dayError } = await supabase
        .schema('operations')
        .from('order_template_days')
        .insert([{ template_id: templateId, day_of_week: day.value }])
        .select('id_template_day')
        .single();
      if (dayError) {
        sileo.error(`Error al guardar el día ${day.label}`);
        console.error(dayError);
        setLoading(false);
        return;
      }

      const details = (dayRecipes[day.value] || []).filter((r) => r.recipe_id);
      const { error: detErr } = await supabase
        .schema('operations')
        .from('order_template_details')
        .insert(
          details.map((r) => ({
            template_day_id: dayData.id_template_day,
            recipe_id: r.recipe_id,
            quantity: Number(r.quantity) || 1,
            macro_modifiable: false,
          }))
        );
      if (detErr) {
        sileo.error(`Error al guardar recetas del día ${day.label}`);
        console.error(detErr);
        setLoading(false);
        return;
      }
    }

    sileo.success(isEdit ? 'Menú actualizado correctamente' : 'Menú creado correctamente');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  // ── Estilos ──
  const inputClass =
    'w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm';
  const labelClass = 'block text-sm font-medium text-slate-600 mb-1';

  return (
    <div className="bg-slate-50 p-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">{isEdit ? 'Editar Menú' : 'Nuevo Menú'}</h1>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? <Check size={14} /> : stepNum}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${isActive ? 'text-slate-800' : 'text-slate-400'}`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-4 ${step > stepNum ? 'bg-green-400' : 'bg-slate-200'}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── PASO 1: Información ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Nombre del menú</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Menú Semana 1"
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className={labelClass}>
                Descripción <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe esta plantilla..."
                rows="3"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Tipo de menú</label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'Lunch', label: '☀️ Almuerzo' },
                  { value: 'Dinner', label: '🌙 Cena' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMealType(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                      mealType === opt.value
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 2: Recetas por día ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-2">
              Asigna las recetas para cada día. Los días sin recetas no se guardarán.
            </p>
            {DAYS.map((day) => (
              <div key={day.value} className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-700">{day.label}</span>
                  <button
                    type="button"
                    onClick={() => addRecipeToDay(day.value)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:border-slate-400 transition"
                  >
                    <Plus size={13} />
                    Agregar receta
                  </button>
                </div>

                {(dayRecipes[day.value] || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Sin recetas asignadas</p>
                ) : (
                  <div className="space-y-2">
                    {(dayRecipes[day.value] || []).map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={item.recipe_id || ''}
                          onChange={(e) =>
                            updateRecipeInDay(day.value, index, 'recipe_id', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                        >
                          <option value="">Seleccionar receta</option>
                          {recipes.map((r) => (
                            <option key={r.id_recipe} value={r.id_recipe}>
                              {r.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateRecipeInDay(day.value, index, 'quantity', e.target.value)
                          }
                          className="w-16 px-3 py-2 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-800"
                        />

                        <button
                          type="button"
                          onClick={() => removeRecipeFromDay(day.value, index)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Navegación ── */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-400 transition text-sm font-medium"
            >
              <ChevronLeft size={16} />
              Atrás
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition text-sm font-medium disabled:opacity-40"
            >
              <Check size={16} />
              {loading ? 'Guardando...' : 'Guardar Menú'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTemplate;
