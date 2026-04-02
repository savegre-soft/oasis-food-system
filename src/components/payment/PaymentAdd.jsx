import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';
import { convertOffsetToTimes } from 'framer-motion';

const PaymentAdd = () => {
  const { supabase } = useApp();

  const [paymentsTypes, setPaymentsTypes] = useState([]);

  const { payment, setNewPayment } = useState({});

  const GetTypes = async () => {
    try {
      const { data, error } = await supabase.schema('operations').from('PaymentsType').select('*');

      if (error) throw error;

      console.log(data);

      setPaymentsTypes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    GetTypes();
  }, []);
  return <></>;
};

export default PaymentAdd;
