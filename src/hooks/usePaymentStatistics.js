import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

/**
 * @typedef {'cash' | 'transfer' | 'card' | string} PaymentType
 */

/**
 * @typedef {'pending' | 'completed' | 'failed' | string} PaymentStatus
 */

/**
 * @typedef {Object} PaymentClient
 * @property {string} name - Nombre del cliente
 */

/**
 * @typedef {Object} Payment
 * @property {number|string} id_payment - ID del pago
 * @property {number|string} client_id - ID del cliente
 * @property {PaymentType} payment_type - Tipo de pago
 * @property {number} amount - Monto del pago
 * @property {string} payment_date - Fecha del pago (YYYY-MM-DD)
 * @property {PaymentStatus} status - Estado del pago
 * @property {PaymentClient|null} clients - Relación con cliente
 */

/**
 * Hook para obtener estadísticas de pagos filtrados por rango de fechas.
 *
 * - Consulta pagos desde Supabase
 * - Incluye relación con clientes
 * - Maneja estado de carga y errores
 *
 * @param {{ from: string, to: string }} params
 *
 * @returns {{
 *  payments: Payment[],
 *  loading: boolean,
 *  error: string|null
 * }}
 */
export const usePaymentStatistics = ({ from, to }) => {
  const { supabase } = useApp();

  /** @type {[Payment[], Function]} */
  const [payments, setPayments] = useState([]);

  /** @type {[boolean, Function]} */
  const [loading, setLoading] = useState(true);

  /** @type {[string|null, Function]} */
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!from || !to) return;

    /**
     * Ejecuta la consulta de pagos
     */
    const run = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .schema('operations')
          .from('payments')
          .select(
            'id_payment, client_id, payment_type, amount, payment_date, status, clients(name)'
          )
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

  return {
    payments,
    loading,
    error,
  };
};