import { useState } from 'react';
import { Plus, X, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'protein',
    label: 'Proteínas',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    input: 'Ej: Pechuga de pollo',
  },
  {
    key: 'carb',
    label: 'Carbohidratos',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    input: 'Ej: Arroz blanco',
  },
  {
    key: 'extra',
    label: 'Extras',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    input: 'Ej: Ensalada verde',
  },
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
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient(category);
    }
  };

  const resetToBase = () => {
    onChange(null);
    setNewItem({ protein: '', carb: '', extra: '' });
  };

  return (
    <div
      className={`rounded-xl border p-3 ${
        isOverridden
          ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20'
          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{recipeName}</p>
          {isOverridden && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Composición modificada
            </span>
          )}
        </div>
        {isOverridden && (
          <button
            type="button"
            onClick={resetToBase}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
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
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                {cat.label}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {items.map((item, i) => (
                  <span
                    key={i}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${cat.badge}`}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeIngredient(cat.key, i)}
                      className="hover:opacity-60 transition"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {items.length === 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Sin {cat.label.toLowerCase()}
                  </span>
                )}
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newItem[cat.key]}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(e, cat.key)}
                  placeholder={cat.input}
                  className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => addIngredient(cat.key)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 transition text-slate-600 dark:text-slate-400"
                >
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
