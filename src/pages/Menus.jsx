import { useEffect, useState } from 'react';
import { Plus, Trash2, CalendarDays, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence } from 'framer-motion';

import Modal from './../components/Modal';
import Offcanvas from './../components/Offcanvas';

import AddRecipe from '../components/AddRecipe';

const Menus = () => {
  const { supabase } = useApp();

  const [vista, setVista] = useState('semanal');
  const [menuSemanal, setMenuSemanal] = useState([]);
  const [menuFamiliar, setMenuFamiliar] = useState([]);
  const [nuevoPlato, setNuevoPlato] = useState('');
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  // ===============================
  // OBTENER DATOS
  // ===============================
  const getData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema('operations')
      .from('recipes')
      .select('id, name, meal_type')
      .eq('is_active', true)
      .order('id', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setMenuSemanal(
      data
        .filter((r) => r.meal_type === 'Lunch')
        .map((r) => ({
          id: r.id,
          plato: r.name,
        }))
    );

    setMenuFamiliar(
      data
        .filter((r) => r.meal_type === 'Dinner')
        .map((r) => ({
          id: r.id,
          plato: r.name,
        }))
    );

    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  // ===============================
  // AGREGAR
  // ===============================
  const agregarMenu = async () => {
    if (!nuevoPlato) return;

    const mealType = vista === 'semanal' ? 'Lunch' : 'Dinner';

    const { error } = await supabase
      .schema('operations')
      .from('recipes')
      .insert([
        {
          name: nuevoPlato,
          description: '',
          meal_type: mealType,
          is_active: true,
        },
      ]);

    if (error) {
      console.error(error);
      return;
    }

    setNuevoPlato('');
    getData(); // refrescar
  };

  // ===============================
  // ELIMINAR (soft delete)
  // ===============================
  const eliminar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('recipes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error(error);
      return;
    }

    getData();
  };

  return (
    <>
      {/* Modal para agregar cliente */}
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <AddRecipe />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Menús</h1>
          <p className="text-slate-500 mt-2">Crea y administra menús semanales y familiares</p>
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

        <button
          className="bg-blue-500 text-white border rounded"
          onClick={() => setShowModal(true)}
        >
          Agregar Receta
        </button>

        {/* Lista */}
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <div className="space-y-4">
            {(vista === 'semanal' ? menuSemanal : menuFamiliar).map((menu) => (
              <div
                key={menu.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center"
              >
                <p className="font-semibold text-slate-800">{menu.plato}</p>

                <button
                  onClick={() => eliminar(menu.id)}
                  className="text-red-500 hover:text-red-600"
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
