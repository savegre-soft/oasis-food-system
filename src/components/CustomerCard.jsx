const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family:   { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

const CustomerCard = ({ customer, onSelected }) => {
  const macro = customer.macro_profiles;
  const typeStyle = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;

  return (
    <div
      onClick={() => onSelected(customer)}
      className="bg-white rounded-xl hover:shadow-2xl hover:border-gray-400 duration-300 transition p-4 shadow-sm border border-slate-200 cursor-pointer"
    >
      {/* Nombre, tipo y estado */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-semibold text-slate-800">{customer.name}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.className}`}>
            {typeStyle.label}
          </span>
        </div>
        {customer.is_active !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-1 ${
            customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {customer.is_active ? 'Activo' : 'Inactivo'}
          </span>
        )}
      </div>

      {/* Info de contacto */}
      <div className="text-sm text-slate-600 space-y-1 mb-3">
        {customer.phone && <p>📞 {customer.phone}</p>}
        {customer.address_detail && (
          <p className="truncate">📍 {customer.address_detail}</p>
        )}
      </div>

      {/* Macro profile */}
      {macro ? (
        <p className="text-xs text-slate-500 italic">👆 Haz click para ver el perfil nutricional</p>
      ) : (
        <p className="text-xs text-slate-400 italic">Sin perfil nutricional</p>
      )}

      {/* Fecha */}
      {customer.created_at && (
        <p className="text-xs text-gray-400 mt-2">
          Creado: {new Date(customer.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default CustomerCard;