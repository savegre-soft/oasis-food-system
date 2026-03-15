import { useMemo, useState } from "react";

export default function useCustomerFilters(customers) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const activeCustomers = useMemo(
    () => customers.filter((c) => c.is_active),
    [customers]
  );

  const inactiveCustomers = useMemo(
    () => customers.filter((c) => !c.is_active),
    [customers]
  );

  const displayed = useMemo(() => {
    const base = activeTab === "active" ? activeCustomers : inactiveCustomers;

    return base.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
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