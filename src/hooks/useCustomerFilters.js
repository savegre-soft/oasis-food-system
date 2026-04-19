import { useMemo, useState } from 'react';

/**
 * @typedef {Object} Customer
 * @property {string|number} id - Identificador del cliente
 * @property {string} name - Nombre del cliente
 * @property {boolean} is_active - Estado activo/inactivo
 */

/**
 * @typedef {'active' | 'inactive'} CustomerTab
 */

/**
 * Hook para gestionar filtros de clientes:
 * - Búsqueda por nombre
 * - Segmentación por estado (activo/inactivo)
 *
 * Incluye listas derivadas memoizadas para optimizar rendimiento.
 *
 * @param {Customer[]} customers - Lista completa de clientes
 *
 * @returns {{
 *  searchTerm: string,
 *  setSearchTerm: (value: string) => void,
 *  activeTab: CustomerTab,
 *  setActiveTab: (tab: CustomerTab) => void,
 *  activeCustomers: Customer[],
 *  inactiveCustomers: Customer[],
 *  displayed: Customer[]
 * }}
 */
export default function useCustomerFilters(customers) {
  /** @type {[string, Function]} */
  const [searchTerm, setSearchTerm] = useState('');

  /** @type {[CustomerTab, Function]} */
  const [activeTab, setActiveTab] = useState('active');

  /**
   * Clientes activos
   */
  const activeCustomers = useMemo(
    () => customers.filter((c) => c.is_active),
    [customers]
  );

  /**
   * Clientes inactivos
   */
  const inactiveCustomers = useMemo(
    () => customers.filter((c) => !c.is_active),
    [customers]
  );

  /**
   * Lista final filtrada por tab + búsqueda
   */
  const displayed = useMemo(() => {
    const base =
      activeTab === 'active' ? activeCustomers : inactiveCustomers;

    const term = searchTerm.toLowerCase();

    return base.filter((c) =>
      c.name.toLowerCase().includes(term)
    );
  }, [activeTab, activeCustomers, inactiveCustomers, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    activeCustomers,
    inactiveCustomers,
    displayed,
  };
}