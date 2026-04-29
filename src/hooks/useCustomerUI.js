import { useState } from 'react';

/**
 * @typedef {'grid' | 'list'} ViewMode
 */

/**
 * @typedef {Object} CustomerRef
 * @property {number|string} id_client - ID del cliente
 * @property {string} name - Nombre del cliente
 * @property {boolean} [is_active] - Estado del cliente
 * @property {Object} [rest] - Otros campos opcionales
 */

/**
 * Hook para gestionar estado UI de clientes:
 * - Modales (crear/editar)
 * - Selección de cliente
 * - Vista detalle
 * - Confirmaciones (eliminar / reactivar)
 * - Selector de vista (grid/list)
 *
 * Este hook es exclusivamente de UI (no lógica de datos).
 *
 * @returns {{
 *  viewSelector: ViewMode,
 *  setViewSelector: (mode: ViewMode) => void,
 *  showModal: boolean,
 *  setShowModal: (value: boolean) => void,
 *  editingCustomer: CustomerRef|null,
 *  setEditingCustomer: (customer: CustomerRef|null) => void,
 *  selectedCustomer: CustomerRef|null,
 *  setSelectedCustomer: (customer: CustomerRef|null) => void,
 *  showDetail: boolean,
 *  setShowDetail: (value: boolean) => void,
 *  toDelete: CustomerRef|null,
 *  setToDelete: (customer: CustomerRef|null) => void,
 *  toReactivate: CustomerRef|null,
 *  setToReactivate: (customer: CustomerRef|null) => void
 * }}
 */
export default function useCustomerUI() {
  /** @type {[ViewMode, Function]} */
  const [viewSelector, setViewSelector] = useState('grid');

  /** @type {[boolean, Function]} */
  const [showModal, setShowModal] = useState(false);

  /** @type {[CustomerRef|null, Function]} */
  const [editingCustomer, setEditingCustomer] = useState(null);

  /** @type {[CustomerRef|null, Function]} */
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  /** @type {[boolean, Function]} */
  const [showDetail, setShowDetail] = useState(false);

  /** @type {[CustomerRef|null, Function]} */
  const [toDelete, setToDelete] = useState(null);

  /** @type {[CustomerRef|null, Function]} */
  const [toReactivate, setToReactivate] = useState(null);

  return {
    viewSelector,
    setViewSelector,
    showModal,
    setShowModal,
    editingCustomer,
    setEditingCustomer,
    selectedCustomer,
    setSelectedCustomer,
    showDetail,
    setShowDetail,
    toDelete,
    setToDelete,
    toReactivate,
    setToReactivate,
  };
}