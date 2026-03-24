import { Pencil, Trash2, EyeIcon, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family: { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

const PLAN_TYPE = {
  estandar: { label: '⭐ Estándar', className: 'bg-slate-100 text-slate-600' },
  nutricional: { label: '🥗 Nutricional', className: 'bg-green-50 text-green-700' },
};

const CustomerCard = ({ customer, onSelected, onEdit, onDelete, onReactivate }) => {
  const typeStyle = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;
  const planStyle = customer.plan_type
    ? (PLAN_TYPE[customer.plan_type] ?? PLAN_TYPE.estandar)
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 duration-200 transition p-4">
      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-slate-800">{customer.name}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.className}`}>
              {typeStyle.label}
            </span>
            {customer.is_active !== undefined && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {customer.is_active ? 'Activo' : 'Inactivo'}
              </span>
            )}
          </div>
          {planStyle && customer.client_type === 'personal' && (
            <span
              className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${planStyle.className}`}
            >
              {planStyle.label}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to={`/cliente/${customer.id_client}`}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-400 transition"
          >
            <EyeIcon size={13} />
          </Link>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(customer)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-400 transition"
            >
              <Pencil size={13} />
            </button>
          )}
          {onReactivate && (
            <button
              type="button"
              onClick={() => onReactivate(customer.id_client)}
              className="p-1.5 rounded-xl border border-green-200 text-green-500 hover:text-green-700 hover:border-green-400 transition"
              title="Reactivar cliente"
            >
              <RotateCcw size={13} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(customer.id_client)}
              className="p-1.5 rounded-xl border border-slate-200 text-red-400 hover:text-red-600 hover:border-red-300 transition"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Body — click to view detail ── */}
      <div onClick={() => onSelected(customer)} className="cursor-pointer">
        <div className="text-sm text-slate-600 space-y-1 mb-2">
          {customer.phone && <p>📞 {customer.phone}</p>}
          {customer.address_detail && <p className="truncate">📍 {customer.address_detail}</p>}
        </div>

        {customer.lunch_macro || customer.dinner_macro ? (
          <p className="text-xs text-slate-500 italic">
            👆 Haz click para ver el perfil nutricional
          </p>
        ) : customer.client_type === 'personal' ? (
          <p className="text-xs text-slate-400 italic">Sin perfil nutricional</p>
        ) : null}

        {customer.created_at && (
          <p className="text-xs text-gray-400 mt-2">
            Creado: {new Date(customer.created_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomerCard;