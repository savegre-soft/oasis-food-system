import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, Image } from 'lucide-react';
import { sileo } from 'sileo';

const CATEGORIES = [
  { key: 'protein', label: 'Proteínas', color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', placeholder: 'Ej: Pechuga de pollo' },
  { key: 'carb', label: 'Carbohidratos', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', placeholder: 'Ej: Arroz blanco' },
  { key: 'extra', label: 'Extras', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', placeholder: 'Ej: Ensalada verde' },
];

const emptyIngredients = () => ({ protein: [], carb: [], extra: [] });

const AddRecipe = ({ onSuccess }) => {
  const { supabase } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(emptyIngredients());
  const [newItem, setNewItem] = useState({ protein: '', carb: '', extra: '' });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  const addIngredient = (category) => {
    const val = newItem[category].trim();
    if (!val) return;

    setIngredients((prev) => ({
      ...prev,
      [category]: [...prev[category], val],
    }));

    setNewItem((prev) => ({ ...prev, [category]: '' }));
  };

  const handleKeyDown = (e, category) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient(category);
    }
  };

  const removeIngredient = (category, index) => {
    setIngredients((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (file) => {
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIngredients(emptyIngredients());
    setNewItem({ protein: '', carb: '', extra: '' });
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    const totalIngredients = Object.values(ingredients).flat().length;

    if (totalIngredients === 0) {
      sileo.error('Agrega al menos un ingrediente');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // subir imagen
      if (image) {
        const fileName = `recipes/${Date.now()}-${image.name}`;

        const { error: uploadError } = await supabase.storage
          .from('Recipes')
          .upload(fileName, image);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('Recipes')
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      // crear receta
      const { data: recipeData, error: recipeError } = await supabase
        .schema('operations')
        .from('recipes')
        .insert([
          {
            name,
            description,
            image_url: imageUrl,
            is_active: true,
          },
        ])
        .select('id_recipe')
        .single();

      if (recipeError) throw recipeError;

      // ingredientes
      const rows = [];

      for (const category of ['protein', 'carb', 'extra']) {
        for (const ingName of ingredients[category]) {
          rows.push({
            recipe_id: recipeData.id_recipe,
            name: ingName,
            category,
          });
        }
      }

      const { error: ingError } = await supabase
        .schema('operations')
        .from('recipe_ingredients')
        .insert(rows);

      if (ingError) throw ingError;

      sileo.success('Receta guardada correctamente');

      resetForm();

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      sileo.error('Error al guardar la receta');
    }

    setLoading(false);
  };

  return (
    <div className="bg-slate-50 p-8 flex justify-center">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">

        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          Agregar Nueva Receta
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nombre del plato
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pollo a la plancha"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Descripción
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el plato..."
              rows="2"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm resize-none"
            />
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Imagen del plato
            </label>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">

              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-500">

                  <Image size={28} />

                  <span className="text-sm">
                    Seleccionar imagen
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files[0])}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Ingredientes */}
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className={`border-2 rounded-2xl p-4 ${cat.color}`}>

              <p className="text-sm font-semibold text-slate-700 mb-3">
                {cat.label}
              </p>

              {ingredients[cat.key].length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">

                  {ingredients[cat.key].map((item, i) => (
                    <span
                      key={i}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${cat.badge}`}
                    >
                      {item}

                      <button
                        type="button"
                        onClick={() => removeIngredient(cat.key, i)}
                        className="hover:opacity-60 transition"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">

                <input
                  type="text"
                  value={newItem[cat.key]}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      [cat.key]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, cat.key)}
                  placeholder={cat.placeholder}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                />

                <button
                  type="button"
                  onClick={() => addIngredient(cat.key)}
                  className="bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-slate-400 transition text-slate-600"
                >
                  <Plus size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-1.5">
                Presiona Enter o + para agregar
              </p>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition disabled:opacity-50 text-sm font-medium"
          >
            <Plus size={18} />
            {loading ? 'Guardando...' : 'Guardar Receta'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddRecipe;