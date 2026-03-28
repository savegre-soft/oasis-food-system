import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const Payments = () => {
  const [paymentsList, setPaymentsList] = useState();

  const GetPaymentsAsync = async () => {
    try {
      const { data, error } = await supabase.schema('operations').from('Payments').select('*');

      if (error) throw error;

      console.table(data);
      setPaymentsList(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    GetPaymentsAsync();
  }, []);

  return (
    <>
      <h4 className=" text-4xl">Pagos</h4>
    </>
  );
};

export default Payments;
