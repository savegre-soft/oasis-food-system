import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import { sileo } from "sileo";

const Test = () => {
  const { supabase } = useApp();

  const [recipes, setRecipes] = useState([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("Recipes").select("*");

      if (!error) {
        setRecipes(data);
      }
      setLoading(false);
    };

    fetchRecipes();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {/* Lado izquierdo */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <BookOpen className="text-emerald-700" size={24} />
          </div>

          <h3 className="text-2xl font-bold text-gray-800">
            Recetas Registradas
          </h3>
        </div>

        {/* Botón */}
        <button
          onClick={() =>
            sileo.error({
              title: "Something went wrong",
              description: "Please try again later.",
            })
          }
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all duration-200 hover:scale-105"
        >
          Agregar Pedido
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="animate-spin" size={20} />
          <span>Cargando recetas...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
          <AlertCircle size={20} />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Grid */}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <li
            key={recipe.id}
            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:-translate-y-1"
          >
            {/* Title */}
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-green-700 transition-colors">
              {recipe.Name}
            </h4>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              {new Date(recipe.created_at).toLocaleString()}
            </div>

            {/* Button */}
            <div className="mt-5">
              <button className="flex items-center gap-2 text-sm bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-all duration-200"
              onClick={()=> sileo.warning({ title: "Aún no se ha implementado" })}
              >
                Ver receta
                <ArrowRight size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Test;
