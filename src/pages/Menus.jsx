import { useEffect, useState } from 'react';
import { Trash2, UtensilsCrossed, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence } from 'framer-motion';
import Modal from './../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AddRecipe from '../components/AddRecipe';

const CATEGORY_STYLE = {
  protein: { label: 'Proteínas',     badge: 'bg-red-100 text-red-700' },
  carb:    { label: 'Carbohidratos', badge: 'bg-amber-100 text-amber-700' },
  extra:   { label: 'Extras',        badge: 'bg-green-100 text-green-700' },
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
        <button type="button" onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition"
        >
          <div>
            <p className="font-semibold text-slate-800">{recipe.name}</p>
            {recipe.description && <p className="text-xs text-slate-400 mt-0.5">{recipe.description}</p>}
          </div>
          {hasIngredients && (
            expanded
              ? <ChevronUp size={16} className="text-slate-400 shrink-0 ml-2" />
              : <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
          )}
        </button>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          {onEdit && (
            <button type="button" onClick={() => onEdit(recipe)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-400 transition">
              <Pencil size={14} />
            </button>
          )}
          <button onClick={() => onDelete(recipe.id_recipe)}
            className="p-1.5 rounded-xl border border-slate-200 text-red-400 hover:text-red-600 hover:border-red-300 transition">
            <Trash2 size={14} />
          </button>
        </div>
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{style.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, i) => (
                    <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
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

const Menus = () => {
  const { supabase } = useApp();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [toDelete,      setToDelete]      = useState(null);
  const [search, setSearch] = useState('');

  const getData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('recipes')
      .select(`
        id_recipe, name, description,
        recipe_ingredients ( id_recipe_ingredient, name, category )
      `)
      .eq('is_active', true)
      .order('id_recipe', { ascending: false });

    if (error) console.error(error);
    else setRecipes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { getData(); }, []);

  const eliminar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('recipes')
      .update({ is_active: false })
      .eq('id_recipe', id);

    if (error) { console.error(error); return; }
    getData();
  };

  const filtered = recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar receta?"
        message="Se eliminará la receta y todos sus ingredientes."
        onConfirm={() => { eliminar(toDelete); setToDelete(null); }}
        onCancel={() => setToDelete(null)}
      />

      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => { setShowModal(false); getData(); }}>
            <AddRecipe onSuccess={() => { setShowModal(false); getData(); }} />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingRecipe && (
          <Modal isOpen={!!editingRecipe} onClose={() => setEditingRecipe(null)}>
            <AddRecipe initialData={editingRecipe} onSuccess={() => { setEditingRecipe(null); getData(); }} />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Recetas</h1>
            <p className="text-slate-500 mt-1">Gestión de recetas y su composición</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition text-sm font-medium"
          >
            <UtensilsCrossed size={16} />
            Agregar Receta
          </button>
        </div>

        {/* Buscador */}
        <div className="mb-6 max-w-sm">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar receta..."
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm bg-white"
          />
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay recetas registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id_recipe} recipe={recipe} onDelete={setToDelete} onEdit={setEditingRecipe} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Menus;
