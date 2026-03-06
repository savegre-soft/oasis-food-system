import { useEffect, useState } from 'react';
import { Trash2, CalendarDays, Users, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence } from 'framer-motion';

import Modal from './../components/Modal';
import AddRecipe from '../components/AddRecipe';

const Menus = () => {
  const { supabase } = useApp();

  const [vista, setVista] = useState('semanal');
  const [menuSemanal, setMenuSemanal] = useState([]);
  const [menuFamiliar, setMenuFamiliar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ===============================
  // OBTENER DATOS
  // ===============================
  const getData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema('operations')
      .from('recipes')
      .select('id_recipe, name, meal_type')
      .eq('is_active', true)
      .order('id_recipe', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setMenuSemanal(data.filter((r) => r.meal_type === 'Lunch'));
    setMenuFamiliar(data.filter((r) => r.meal_type === 'Dinner'));

    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  // ===============================
  // ELIMINAR (soft delete)
  // ===============================
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

  const listaActual = vista === 'semanal' ? menuSemanal : menuFamiliar;

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => { setShowModal(false); getData(); }}>
            <AddRecipe onSuccess={() => { setShowModal(false); getData(); }} />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Recetas</h1>
            <p className="text-slate-500 mt-2">Crea y administra recetas semanales y familiares</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition text-sm font-medium"
          >
            <UtensilsCrossed size={16} />
            Agregar Receta
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-200 p-1 rounded-xl w-fit mb-8">
          <button
            onClick={() => setVista('semanal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              vista === 'semanal' ? 'bg-white shadow text-slate-800' : 'text-slate-600'
            }`}
          >
            <CalendarDays size={16} />
            Plan Semanal
          </button>

          <button
            onClick={() => setVista('familiar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              vista === 'familiar' ? 'bg-white shadow text-slate-800' : 'text-slate-600'
            }`}
          >
            <Users size={16} />
            Familiar
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : listaActual.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay recetas registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listaActual.map((recipe) => (
              <div
                key={recipe.id_recipe}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center"
              >
                <p className="font-semibold text-slate-800">{recipe.name}</p>

                <button
                  onClick={() => eliminar(recipe.id_recipe)}
                  className="text-red-500 hover:text-red-600 ml-4"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Menus;
