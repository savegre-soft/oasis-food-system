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
  protein: { label: 'Proteínas', badge: 'bg-red-100 text-red-700' },
  carb: { label: 'Carbohidratos', badge: 'bg-amber-100 text-amber-700' },
  extra: { label: 'Extras', badge: 'bg-green-100 text-green-700' },
};

const RecipeCard = ({ recipe, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  const byCategory = { protein: [], carb: [], extra: [] };
  for (const ing of recipe.recipe_ingredients ?? []) {
    if (byCategory[ing.category]) byCategory[ing.category].push(ing.name);
  }

  const hasIngredients = Object.values(byCategory).some((arr) => arr.length > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition"
        >
          <div>
            <p className="font-semibold text-slate-800">{recipe.name}</p>
            {recipe.description && (
              <p className="text-xs text-slate-400 mt-0.5">{recipe.description}</p>
            )}
          </div>
          {hasIngredients &&
            (expanded ? (
              <ChevronUp size={16} className="text-slate-400 shrink-0 ml-2" />
            ) : (
              <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
            ))}
        </button>
        <button
          onClick={() => onEdit(recipe)}
          className="text-green-600 hover:text-green-600 transition ml-4 shrink-0"
        >
          <PencilIcon size={18} />
        </button>

        <button
          onClick={() => onDelete(recipe.id_recipe)}
          className="text-red-400 hover:text-red-600 transition ml-4 shrink-0"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Ingredientes por categoría */}
      {expanded && hasIngredients && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          {['protein', 'carb', 'extra'].map((cat) => {
            const items = byCategory[cat];
            if (items.length === 0) return null;
            const style = CATEGORY_STYLE[cat];
            return (
              <div key={cat}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
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
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400 italic">Sin ingredientes registrados</p>
        </div>
      )}
    </div>
  );
};

export default RecipeCard;
