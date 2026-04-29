import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

/**
 * @typedef {Object} MacroProfile
 * @property {number} id_macro_profile - ID del perfil
 * @property {string} name - Nombre del perfil
 * @property {number} protein_value - Valor de proteína
 * @property {number} carb_value - Valor de carbohidratos
 */

/**
 * @typedef {Object} Customer
 * @property {number|string} id_client - ID del cliente
 * @property {string} name - Nombre del cliente
 * @property {boolean} is_active - Estado activo/inactivo
 * @property {MacroProfile|null} lunch_macro - Perfil de macros para almuerzo
 * @property {MacroProfile|null} dinner_macro - Perfil de macros para cena
 * @property {Object} [rest] - Otros campos provenientes de la BD
 */

/**
 * Hook para gestionar clientes:
 * - Fetch desde Supabase con relaciones (macro profiles)
 * - Activación / desactivación lógica
 *
 * Encapsula la lógica de acceso a datos y mantiene el estado sincronizado.
 *
 * @returns {{
 *  customers: Customer[],
 *  fetchCustomers: () => Promise<void>,
 *  eliminar: (id: number|string) => Promise<void>,
 *  reactivar: (id: number|string) => Promise<void>
 * }}
 */
export default function useCustomers() {
  const { supabase } = useApp();

  /** @type {[Customer[], Function]} */
  const [customers, setCustomers] = useState([]);

  /**
   * Obtiene la lista de clientes con sus perfiles de macros relacionados
   *
   * @returns {Promise<void>}
   */
  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('clients')
      .select(
        `
        *,
        lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey (
          id_macro_profile, name,
          protein_value,
          carb_value
        ),
        dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey (
          id_macro_profile, name,
          protein_value,
          carb_value
        )
      `
      )
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    if (data) {
      setCustomers(data);
    }
  };

  /**
   * Desactiva un cliente (soft delete)
   *
   * @param {number|string} id - ID del cliente
   * @returns {Promise<void>}
   */
  const eliminar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('clients')
      .update({ is_active: false })
      .eq('id_client', id);

    if (error) {
      console.error('Error disabling customer:', error);
      return;
    }

    await fetchCustomers();
  };

  /**
   * Reactiva un cliente
   *
   * @param {number|string} id - ID del cliente
   * @returns {Promise<void>}
   */
  const reactivar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('clients')
      .update({ is_active: true })
      .eq('id_client', id);

    if (error) {
      console.error('Error reactivating customer:', error);
      return;
    }

    await fetchCustomers();
  };

  /**
   * Carga inicial de clientes al montar el hook
   */
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