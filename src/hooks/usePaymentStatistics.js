import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export const usePaymentStatistics = ({ from, to }) => {
  const { supabase } = useApp();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!from || !to) return;

    const run = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .schema('operations')
          .from('payments')
          .select('id_payment, client_id, payment_type, amount, payment_date, status, clients(name)')
          .gte('payment_date', from)
          .lte('payment_date', to)
          .order('payment_date');
        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [from, to, supabase]);

  return { payments, loading, error };
};
