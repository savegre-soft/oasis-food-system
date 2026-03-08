import { useEffect, useState, useMemo } from "react";
import { ClipboardList, Search } from "lucide-react";
import { useApp } from "../context/AppContext";
import { AnimatePresence } from "framer-motion";

import Modal from "../components/Modal";
import AddOrder from "../components/AddOrder";
import OrderCard from "../components/OrderCard";

const Orders = () => {
  const { supabase } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 6;

  // ===============================
  // OBTENER DATOS
  // ===============================
  const getData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema("operations")
      .from("orders")
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
      .order("id_order", { ascending: false });

    if (error) {
      console.error("❌ Error cargando pedidos");
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

  // ===============================
  // BUSCADOR
  // ===============================
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;

    const term = search.toLowerCase();

    return orders.filter(
      (o) =>
        o.clients?.name?.toLowerCase().includes(term) ||
        o.routes?.name?.toLowerCase().includes(term)
    );
  }, [orders, search]);

  // ===============================
  // PAGINACIÓN
  // ===============================
  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return filteredOrders.slice(start, end);
  }, [filteredOrders, page]);

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              getData();
            }}
          >
            <AddOrder
              onSuccess={() => {
                setShowModal(false);
                getData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Pedidos</h1>
            <p className="text-slate-500 mt-2">
              Registra y gestiona los pedidos semanales
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition text-sm font-medium"
          >
            <ClipboardList size={16} />
            Nuevo Pedido
          </button>
        </div>

        {/* Buscador */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Buscar por cliente o ruta..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay pedidos registrados</p>
          </div>
        ) : (
          <>
            {/* CONTENEDOR CON SCROLL */}
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
              {paginatedOrders.map((order) => (
                <OrderCard key={order.id_order} order={order} />
              ))}
            </div>

            {/* PAGINACIÓN */}
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
              >
                Anterior
              </button>

              <span className="text-sm text-slate-600">
                Página {page} de {totalPages || 1}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Orders;