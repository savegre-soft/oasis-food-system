import { useEffect, useState } from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence } from 'framer-motion';

import Modal from '../components/Modal';
import AddRoute from '../components/AddRoute';
import RouteCard from '../components/RouteCard';

const Routes = () => {
  const { supabase } = useApp();

  const [systemRoutes, setSystemRoutes] = useState([]);
  const [customRoutes, setCustomRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ===============================
  // OBTENER DATOS
  // ===============================
  const getData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema('operations')
      .from('routes')
      .select(`
        id_route,
        name,
        description,
        is_active,
        route_type,
        route_delivery_days (
          id_delivery_day,
          day_of_week
        )
      `)
      .eq('is_active', true)
      .order('id_route', { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Separar rutas del sistema (tienen route_type) de las personalizadas
    setSystemRoutes(data.filter((r) => r.route_type != null));
    setCustomRoutes(data.filter((r) => r.route_type == null));
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  // ===============================
  // ELIMINAR (soft delete — solo rutas personalizadas)
  // ===============================
  const eliminar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('routes')
      .update({ is_active: false })
      .eq('id_route', id);

    if (error) {
      console.error(error);
      return;
    }

    getData();
  };

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => { setShowModal(false); getData(); }}>
            <AddRoute onSuccess={() => { setShowModal(false); getData(); }} />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Rutas</h1>
            <p className="text-slate-500 mt-2">Administra las rutas de entrega del sistema</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition text-sm font-medium"
          >
            <MapPin size={16} />
            Agregar Ruta
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <div className="space-y-10">

            {/* ── Rutas del sistema ── */}
            {systemRoutes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={16} className="text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Rutas del sistema
                  </h2>
                </div>
                <div className="space-y-3">
                  {systemRoutes.map((route) => (
                    <RouteCard key={route.id_route} route={route} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Rutas personalizadas ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Rutas personalizadas
                </h2>
              </div>

              {customRoutes.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <MapPin size={36} className="mx-auto mb-3 opacity-30" />
                  <p>No hay rutas personalizadas registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customRoutes.map((route) => (
                    <RouteCard key={route.id_route} route={route} onDelete={eliminar} />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default Routes;