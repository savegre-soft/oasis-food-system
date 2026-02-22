import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const Test = () => {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("Recipes")
        .select("*");

      if (error) {
        setError(error.message);
      } else {
        setRecipes(data);
      }

      console.log("Fetched recipes:", data);
      setLoading(false);
    };

    fetchRecipes();
  }, []);

  return (
    <div>
      <h3>Test data</h3>

      {loading && <p>Cargando...</p>}
      {error && <p>Error: {error}</p>}

      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <strong>{recipe.title}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Test;