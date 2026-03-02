const CustomerCard = ({ customer }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{customer.name}</h3>
      
      <div className="text-sm text-slate-600 space-y-1">
        {customer.phone && <p>Teléfono: {customer.phone}</p>}
        {customer.address_detail && <p>Dirección: {customer.address_detail}</p>}
        {customer.is_active !== undefined && (
          <p>
            Estado:{" "}
            <span className={customer.is_active ? "text-green-600" : "text-red-600"}>
              {customer.is_active ? "Activo" : "Inactivo"}
            </span>
          </p>
        )}
        {customer.created_at && <p className="text-xs text-gray-400">Creado: {new Date(customer.created_at).toLocaleDateString()}</p>}
      </div>
    </div>
  );
};

export default CustomerCard;