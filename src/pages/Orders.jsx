import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence } from 'framer-motion';

import Modal from '../components/Modal';
import AddOrder from '../components/AddOrder';
import OrderCard from '../components/OrderCard';

const Orders = () => {
  const { supabase } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ===============================
  // OBTENER DATOS
  // ===============================
  const getData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema('operations')
      .from('orders')
      .select(`
        id_order,
        week_start_date,
        week_end_date,
        classification,
        status,
        protein_snapshot,
        protein_unit_snapshot,
        carb_snapshot,
        carb_unit_snapshot,
        clients ( id_client, name ),
        routes ( id_route, name ),
        order_days (
          id_order_day,
          day_of_week,
          delivery_date,
          status
        )
      `)
      .order('id_order', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => { setShowModal(false); getData(); }}>
            <AddOrder onSuccess={() => { setShowModal(false); getData(); }} />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Pedidos</h1>
            <p className="text-slate-500 mt-2">Registra y gestiona los pedidos semanales</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition text-sm font-medium"
          >
            <ClipboardList size={16} />
            Nuevo Pedido
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay pedidos registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id_order} order={order} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;