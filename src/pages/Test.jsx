import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

const Test = () => {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase.from("Recipes").select("*");

      if (error) {
        console.log("Error fetching recipes:", error);
        setError(error.message);
      } else {
        console.log("Fetched recipes:", data);
        setRecipes(data);
      }
      setLoading(false);
    };

    fetchRecipes();
  }, []);

  return (
    <div>
      <h3>Test data</h3>

      {loading && <p>Cargando...</p>}
      {error && <p>Error: {error}</p>}

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <li
            key={recipe.id}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100"
          >
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {recipe.Name}
            </h4>

            <p className="text-sm text-gray-500">
              {new Date(recipe.created_at).toLocaleString()}
            </p>

            <div className="mt-4">
              <button className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                Ver receta
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Test;
