
const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family: { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};


const  InactiveCustomerCard =({ customer, onReactivate })=> {
  const typeStyle = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 opacity-70">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-semibold text-slate-600">{customer.name}</h3>

            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.className}`}>
              {typeStyle.label}
            </span>

            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              Inactivo
            </span>
          </div>

          <div className="text-sm text-slate-400 space-y-0.5">
            {customer.phone && <p>📞 {customer.phone}</p>}
            {customer.address_detail && <p className="truncate">📍 {customer.address_detail}</p>}
          </div>

          {customer.created_at && (
            <p className="text-xs text-gray-400 mt-1">
              Creado: {new Date(customer.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onReactivate(customer.id_client)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400 transition text-xs font-medium shrink-0"
        >
          <RotateCcw size={13} />
          Reactivar
        </button>
      </div>
    </div>
  );
}
export default InactiveCustomerCard