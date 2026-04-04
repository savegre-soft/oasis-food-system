import { useState, useEffect } from 'react';
import PaymentAdd from './payment/PaymentAdd';
import PaymentTable from './payment/PaymentTable';
import Modal from '../components/Modal';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const PaymentSection = ({ clientId }) => {
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([]);

  const { supabase } = useApp();

  const getData = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('Payments')
      .select(
        `
      *,
      PaymentsType (
        id,
        name
      )
    `
      )
      .eq('ClientId', clientId);

    if (error) {
      console.error(error);
      return;
    }

    setPayments(data || []);
  };

  useEffect(() => {
    if (clientId) {
      getData();
    }
  }, [clientId]);

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
            }}
          >
            <PaymentAdd
              clientId={clientId}
              onSuccess={() => {
                setShowModal(false);
                getData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pagos</p>

          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Agregar
          </button>
        </div>

        <PaymentTable items={payments} />
      </div>
    </>
  );
};

export default PaymentSection;
