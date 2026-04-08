import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

const Settings = () => {
  const { supabase } = useApp();

  useEffect(() => {
    const GetData = async () => {
      const { data, error } = await supabase.schema('operations').from('countries').select('*');

      console.log(data);
    };
    GetData();
  }, []);

  return (
    <>
      <h2>Configuración</h2>
    </>
  );
};

export default Settings;
