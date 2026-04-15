import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

import { useApp } from '../context/AppContext';
import PaymentTable from './payment/PaymentTable';
import OrderDetailModal from './OrderDetailModal';
import { sileo } from 'sileo';

const PaymentSection = ({ clientId }) => {
  const { supabase } = useApp();
  const [payments, setPayments]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [editingStatus, setEditingStatus] = useState(null);
  const [viewingOrder, setViewingOrder]   = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('payments')
      .select(`
        id_payment, client_id, payment_type, amount, currency,
        payment_date, status, notes, created_at,
        clients(name),
        payment_orders(
          id_payment_order, order_id,
          orders(
            id_order, week_start_date, week_end_date, classification, status,
            order_days(
              id_order_day, day_of_week, delivery_date, status,
              order_day_details(id_order_day_detail, recipe_id, quantity, recipes(id_recipe, name))
            )
          )
        )
      `)
      .eq('client_id', clientId)
      .order('payment_date', { ascending: false });

    if (error) console.error('[PaymentSection] fetch error:', error);
    setPayments(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (clientId) fetchPayments();
  }, [clientId]);

  const handleStatusSave = async (paymentId, newStatus) => {
    const { error } = await supabase
      .schema('operations')
      .from('payments')
      .update({ status: newStatus })
      .eq('id_payment', paymentId);

    if (error) {
      sileo.error({ title: 'Error', description: 'No se pudo actualizar el estado' });
      return;
    }
    setEditingStatus(null);
    fetchPayments();
  };

  return (
    <>
      <AnimatePresence>
        {viewingOrder && (
          <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
        )}
      </AnimatePresence>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pagos</p>

        {loading ? (
          <p className="text-xs text-slate-400 py-2">Cargando pagos...</p>
        ) : (
          <PaymentTable
            payments={payments}
            editingStatus={editingStatus}
            onStatusEdit={setEditingStatus}
            onStatusSave={handleStatusSave}
            onStatusCancel={() => setEditingStatus(null)}
            onViewOrder={setViewingOrder}
            emptyMessage="Sin pagos registrados"
          />
        )}
      </div>
    </>
  );
};

export default PaymentSection;
