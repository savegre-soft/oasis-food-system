import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';
import { isGramCategory, COMBO_CATEGORY_LABEL } from './comboUtils';

const AddComboItem = ({ category, initialData, onSuccess }) => {
  const { supabase } = useApp();
  const isEdit = !!initialData;
  const usesGrams = isGramCategory(category);

  const [name, setName] = useState(initialData?.name ?? '');
  const [portionSizeG, setPortionSizeG] = useState(initialData?.portion_size_g ?? '');
  const [recipeId, setRecipeId] = useState(initialData?.recipe_id ?? '');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('recipes')
        .select('id_recipe, name')
        .eq('is_active', true)
        .order('name');
      setRecipes(data ?? []);
    };
    fetchRecipes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (usesGrams && (portionSizeG === '' || Number(portionSizeG) <= 0)) {
      sileo.error('Ingresa la porción en gramos');
      return;
    }
    setLoading(true);

    const payload = {
      category,
      name: name.trim(),
      portion_size_g: usesGrams ? Number(portionSizeG) : null,
      recipe_id: recipeId || null,
    };

    const { error } = isEdit
      ? await supabase
          .schema('operations')
          .from('combo_items')
          .update(payload)
          .eq('id_combo_item', initialData.id_combo_item)
      : await supabase.schema('operations').from('combo_items').insert([payload]);

    if (error) {
      sileo.error(isEdit ? 'Error al actualizar el ítem' : 'Error al guardar el ítem');
      console.error(error);
      setLoading(false);
      return;
    }

    sileo.success(isEdit ? 'Ítem actualizado' : 'Ítem guardado');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-1">
        {isEdit ? 'Editar ítem' : 'Nuevo ítem'}
      </h2>
      <p className="text-sm text-slate-500 mb-6">Categoría: {COMBO_CATEGORY_LABEL[category]}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Arroz blanco"
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
          />
        </div>

        {usesGrams && (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Porción (gramos)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={portionSizeG}
              onChange={(e) => setPortionSizeG(e.target.value)}
              placeholder="Ej: 250"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Receta vinculada (opcional)
          </label>
          <select
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm bg-white"
          >
            <option value="">Sin vincular</option>
            {recipes.map((r) => (
              <option key={r.id_recipe} value={r.id_recipe}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar ítem'}
        </button>
      </form>
    </div>
  );
};

export default AddComboItem;
