import { useEffect, useState } from 'react';
import {
  Trash2,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  PencilIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence } from 'framer-motion';
import Modal from './../components/Modal';
import AddRecipe from '../components/AddRecipe';

const CATEGORY_STYLE = {
  protein: { label: 'Proteínas', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  carb: { label: 'Carbohidratos', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  extra: { label: 'Extras', badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
};

const RecipeCard = ({ recipe, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  const byCategory = { protein: [], carb: [], extra: [] };
  for (const ing of recipe.recipe_ingredients ?? []) {
    if (byCategory[ing.category]) byCategory[ing.category].push(ing.name);
  }

  const hasIngredients = Object.values(byCategory).some((arr) => arr.length > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition"
        >
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{recipe.name}</p>
            {recipe.description && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{recipe.description}</p>
            )}
          </div>
          {hasIngredients &&
            (expanded ? (
              <ChevronUp size={16} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
            ) : (
              <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
            ))}
        </button>
        <button
          onClick={() => onEdit(recipe)}
          className="text-green-600 dark:text-green-500 hover:text-green-600 dark:hover:text-green-400 transition ml-4 shrink-0"
        >
          <PencilIcon size={18} />
        </button>

        <button
          onClick={() => onDelete(recipe.id_recipe)}
          className="text-red-400 dark:text-red-500/80 hover:text-red-600 dark:hover:text-red-400 transition ml-4 shrink-0"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Ingredientes por categoría */}
      {expanded && hasIngredients && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 space-y-3">
          {['protein', 'carb', 'extra'].map((cat) => {
            const items = byCategory[cat];
            if (items.length === 0) return null;
            const style = CATEGORY_STYLE[cat];
            return (
              <div key={cat}>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  {style.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, i) => (
                    <span
                      key={i}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sin ingredientes */}
      {expanded && !hasIngredients && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3">
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin ingredientes registrados</p>
        </div>
      )}
    </div>
  );
};

export default RecipeCard;
