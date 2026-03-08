import { useState } from 'react';
import { Plus, X, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  { key: 'protein', label: 'Proteínas',     badge: 'bg-red-100 text-red-700',     input: 'Ej: Pechuga de pollo' },
  { key: 'carb',    label: 'Carbohidratos', badge: 'bg-amber-100 text-amber-700', input: 'Ej: Arroz blanco' },
  { key: 'extra',   label: 'Extras',        badge: 'bg-green-100 text-green-700', input: 'Ej: Ensalada verde' },
];

// baseIngredients: { protein: ['Pollo', ...], carb: [...], extra: [...] }
// value: null (usa base) | { protein: [...], carb: [...], extra: [...] } (override)
// onChange: (newValue) => void  — null para resetear a base

const RecipeIngredientEditor = ({ recipeName, baseIngredients, value, onChange }) => {
  const [newItem, setNewItem] = useState({ protein: '', carb: '', extra: '' });

  const isOverridden = value !== null && value !== undefined;
  const current = isOverridden ? value : baseIngredients;

  const addIngredient = (category) => {
    const val = newItem[category].trim();
    if (!val) return;
    const updated = { ...current, [category]: [...(current[category] ?? []), val] };
    onChange(updated);
    setNewItem((prev) => ({ ...prev, [category]: '' }));
  };

  const removeIngredient = (category, index) => {
    const updated = { ...current, [category]: current[category].filter((_, i) => i !== index) };
    onChange(updated);
  };

  const handleKeyDown = (e, category) => {
    if (e.key === 'Enter') { e.preventDefault(); addIngredient(category); }
  };

  const resetToBase = () => {
    onChange(null);
    setNewItem({ protein: '', carb: '', extra: '' });
  };

  return (
    <div className={`rounded-xl border p-3 ${isOverridden ? 'border-blue-200 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-700">{recipeName}</p>
          {isOverridden && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Composición modificada
            </span>
          )}
        </div>
        {isOverridden && (
          <button type="button" onClick={resetToBase}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
          >
            <RotateCcw size={11} /> Usar base
          </button>
        )}
      </div>

      {/* Categorías */}
      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const items = current?.[cat.key] ?? [];
          return (
            <div key={cat.key}>
              <p className="text-xs font-medium text-slate-500 mb-1.5">{cat.label}</p>

              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {items.map((item, i) => (
                  <span key={i} className={`flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${cat.badge}`}>
                    {item}
                    <button type="button" onClick={() => removeIngredient(cat.key, i)}
                      className="hover:opacity-60 transition">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {items.length === 0 && (
                  <span className="text-xs text-slate-400 italic">Sin {cat.label.toLowerCase()}</span>
                )}
              </div>

              <div className="flex gap-1.5">
                <input type="text" value={newItem[cat.key]}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(e, cat.key)}
                  placeholder={cat.input}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                />
                <button type="button" onClick={() => addIngredient(cat.key)}
                  className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl hover:border-slate-400 transition text-slate-600">
                  <Plus size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecipeIngredientEditor;