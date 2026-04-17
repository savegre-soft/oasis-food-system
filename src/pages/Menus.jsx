import { useEffect, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence } from 'framer-motion';
import Modal from './../components/Modal';

import AddRecipe from '../components/AddRecipe';
import RecipeCard from '../components/RecipeCard';
import EditRecipe from '../components/EditRecipe';

const Menus = () => {
  const { supabase } = useApp();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);

  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [search, setSearch] = useState('');

  const getData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema('operations')
      .from('recipes')
      .select(
        `
        id_recipe,
        name,
        description,
        recipe_ingredients (
          id_recipe_ingredient,
          name,
          category
        )
      `
      )
      .eq('is_active', true)
      .order('id_recipe', { ascending: false });

    if (error) console.error(error);
    else setRecipes(data ?? []);

    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  const eliminar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('recipes')
      .update({ is_active: false })
      .eq('id_recipe', id);

    if (error) {
      console.error(error);
      return;
    }

    getData();
  };

  const openAddModal = () => {
    setSelectedRecipe(null);
    setModalType('add');
    setShowModal(true);
  };

  const openEditModal = (recipe) => {
    setSelectedRecipe(recipe);
    setModalType('edit');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecipe(null);
    setModalType(null);

    getData();
  };

  const filtered = recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={closeModal}>
            {modalType === 'add' && <AddRecipe onSuccess={closeModal} />}

            {modalType === 'edit' && <EditRecipe recipe={selectedRecipe} onSuccess={closeModal} />}
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">
        {/* Header */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Platos</h1>

            <p className="text-slate-500 mt-1">Gestión de platos y su composición</p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition text-sm font-medium"
          >
            <UtensilsCrossed size={16} />
            Agregar Plato
          </button>
        </div>

        {/* Buscador */}

        <div className="mb-6 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plato..."
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm bg-white"
          />
        </div>

        {/* Lista */}

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />

            <p>No hay platos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((recipe) => (
              <RecipeCard
                key={recipe.id_recipe}
                recipe={recipe}
                onDelete={eliminar}
                onEdit={openEditModal}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Menus;
