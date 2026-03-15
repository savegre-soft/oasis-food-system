import { useEffect, useState } from "react";
import { Plus, Trash2, Save, ImagePlus } from "lucide-react";
import { useApp } from "../context/AppContext";

const CATEGORIES = [
  { key: "protein", label: "Proteínas", color: "bg-red-50 border-red-200" },
  { key: "carb", label: "Carbohidratos", color: "bg-amber-50 border-amber-200" },
  { key: "extra", label: "Extras", color: "bg-green-50 border-green-200" }
];

const EditRecipe = ({ recipe, onSuccess }) => {

  const { supabase } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [ingredients, setIngredients] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (!recipe) return;

    setName(recipe.name ?? "");
    setDescription(recipe.description ?? "");
    setImagePreview(recipe.image_url ?? null);

    setIngredients(
      recipe.recipe_ingredients?.map((i) => ({
        id: i.id_recipe_ingredient,
        name: i.name,
        category: i.category
      })) ?? []
    );

  }, [recipe]);

  const handleImageChange = (file) => {

    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

  };

  const uploadImage = async () => {

  if (!imageFile) return recipe.image_url;

  try {

    const fileExt = imageFile.name.split(".").pop();

    const fileName =
      Date.now() + "-" + recipe.id_recipe + "." + fileExt;

    const filePath = `recipes/${fileName}`;

    console.log("📤 Subiendo imagen:", filePath);

    const { error } = await supabase
      .storage
      .from("Recipes")
      .upload(filePath, imageFile, { upsert: true });

    if (error) {

      console.error("❌ Error subiendo imagen");
      console.error("Mensaje:", error.message);
      console.error("Detalles:", error.details);
      console.error("Objeto:", error);

      throw error;

    }

    const { data } = supabase
      .storage
      .from("Recipes")
      .getPublicUrl(filePath);

    console.log("✅ Imagen subida:", data.publicUrl);

    return data.publicUrl;

  } catch (err) {

    console.error("❌ Fallo uploadImage:", err);
    throw err;

  }

};

  const addIngredient = (category) => {

    setIngredients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        category
      }
    ]);

  };

  const removeIngredient = (index) => {

    setIngredients((prev) =>
      prev.filter((_, i) => i !== index)
    );

  };

  const updateIngredient = (index, value) => {

    setIngredients((prev) => {

      const copy = [...prev];
      copy[index].name = value;
      return copy;

    });

  };

  const save = async () => {

    if (!name.trim()) return;

    setLoading(true);

    try {

      const imageUrl = await uploadImage();

      // actualizar receta
      await supabase
        .schema("operations")
        .from("recipes")
        .update({
          name,
          description,
          image_url: imageUrl
        })
        .eq("id_recipe", recipe.id_recipe);

      // ---- INGREDIENTES ----

      const existingIds =
        recipe.recipe_ingredients?.map(
          (i) => i.id_recipe_ingredient
        ) ?? [];

      const currentIds = ingredients
        .filter((i) => typeof i.id === "number")
        .map((i) => i.id);

      const deletedIds =
        existingIds.filter(
          (id) => !currentIds.includes(id)
        );

      // eliminar los que se quitaron
      if (deletedIds.length > 0) {

        await supabase
          .schema("operations")
          .from("recipe_ingredients")
          .delete()
          .in("id_recipe_ingredient", deletedIds);

      }

      // actualizar o insertar
      for (const ing of ingredients) {

        if (!ing.name.trim()) continue;

        if (typeof ing.id === "number") {

          await supabase
            .schema("operations")
            .from("recipe_ingredients")
            .update({
              name: ing.name,
              category: ing.category
            })
            .eq("id_recipe_ingredient", ing.id);

        } else {

          await supabase
            .schema("operations")
            .from("recipe_ingredients")
            .insert({
              id_recipe: recipe.id_recipe,
              name: ing.name,
              category: ing.category
            });

        }

      }

      onSuccess?.();

    } catch (err) {

      console.error(err);

    }

    setLoading(false);

  };

  return (

    <div className="bg-slate-50 p-8 flex justify-center">

      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">

        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          Editar Receta
        </h1>

        {/* Imagen */}
        <div className="mb-6">

          <p className="text-sm font-medium text-slate-600 mb-2">
            Imagen del plato
          </p>

          <div className="flex items-center gap-4">

            {imagePreview && (
              <img
                src={imagePreview}
                alt="preview"
                className="w-24 h-24 object-cover rounded-xl border"
              />
            )}

            <label className="cursor-pointer flex items-center gap-2 text-sm bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition">

              <ImagePlus size={16} />

              Cambiar imagen

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleImageChange(e.target.files[0])
                }
              />

            </label>

          </div>

        </div>

        {/* Nombre */}
        <div className="mb-4">

          <label className="block text-sm font-medium text-slate-600 mb-1">
            Nombre del plato
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
          />

        </div>

        {/* Descripción */}
        <div className="mb-6">

          <label className="block text-sm font-medium text-slate-600 mb-1">
            Descripción
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="2"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
          />

        </div>

        {/* Ingredientes */}
        <div className="space-y-6">

          {CATEGORIES.map((cat) => (

            <div
              key={cat.key}
              className={`border-2 rounded-2xl p-4 ${cat.color}`}
            >

              <div className="flex justify-between mb-3">

                <p className="text-sm font-semibold">
                  {cat.label}
                </p>

                <button
                  onClick={() => addIngredient(cat.key)}
                  className="text-xs flex items-center gap-1 bg-white border px-2 py-1 rounded-lg"
                >
                  <Plus size={14} />
                  Agregar
                </button>

              </div>

              <div className="space-y-2">

                {ingredients.map((ing, index) => {

                  if (ing.category !== cat.key) return null;

                  return (

                    <div
                      key={ing.id}
                      className="flex gap-2"
                    >

                      <input
                        value={ing.name}
                        onChange={(e) =>
                          updateIngredient(
                            index,
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border rounded-xl text-sm"
                        placeholder="Ingrediente"
                      />

                      <button
                        onClick={() =>
                          removeIngredient(index)
                        }
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  );

                })}

              </div>

            </div>

          ))}

        </div>

        {/* Guardar */}
        <div className="flex justify-end mt-8">

          <button
            onClick={save}
            disabled={loading}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? "Guardando..." : "Guardar"}
          </button>

        </div>

      </div>

    </div>

  );

};

export default EditRecipe;