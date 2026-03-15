import { useState } from "react";

export default function useCustomerUI() {
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toReactivate, setToReactivate] = useState(null);

  return {
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