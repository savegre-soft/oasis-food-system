import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function useCustomers() {
  const { supabase } = useApp();
  const [customers, setCustomers] = useState([]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('clients')
      .select(
        `
        *,
        lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey (
          id_macro_profile, name,
          protein_value, protein_unit,
          carb_value, carb_unit
        ),
        dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey (
          id_macro_profile, name,
          protein_value, protein_unit,
          carb_value, carb_unit
        )
      `
      )
      .order('name', { ascending: true });

    if (data) setCustomers(data);
    if (error) console.error(error);
  };

  const eliminar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('clients')
      .update({ is_active: false })
      .eq('id_client', id);

    if (!error) fetchCustomers();
  };

  const reactivar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('clients')
      .update({ is_active: true })
      .eq('id_client', id);

    if (!error) fetchCustomers();
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    fetchCustomers,
    eliminar,
    reactivar,
  };
}
