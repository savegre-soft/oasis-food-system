import { Pencil, Trash2, EyeIcon, RotateCcw, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE = {
  personal: { label: 'Personal', pill: 'bg-blue-50 text-blue-600', accent: 'bg-blue-500' },
  family:   { label: 'Familiar', pill: 'bg-purple-50 text-purple-600', accent: 'bg-purple-500' },
};

const initials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

const CustomerCard = ({ customer, onSelected, onEdit, onDelete, onReactivate }) => {
  const type = TYPE[customer.client_type] ?? TYPE.personal;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition duration-200 flex flex-col">
      {/* Body */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer flex-1"
        onClick={() => onSelected(customer)}
      >
        {/* Avatar */}
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${type.accent}`}
        >
          {initials(customer.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-slate-800 truncate">{customer.name}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${type.pill}`}>
              {type.label}
            </span>
            {customer.is_active === false && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                Inactivo
              </span>
            )}
          </div>

          <div className="space-y-0.5 mt-1">
            {customer.phone && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone size={11} className="shrink-0 text-slate-400" />
                {customer.phone}
              </p>
            )}
            {customer.address_detail && (
              <p className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                <MapPin size={11} className="shrink-0 text-slate-300" />
                <span className="truncate">{customer.address_detail}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t border-slate-50">
        <Link
          to={`/cliente/${customer.id_client}`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          title="Ver perfil"
        >
          <EyeIcon size={13} />
        </Link>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
        )}
        {onReactivate && (
          <button
            type="button"
            onClick={() => onReactivate(customer.id_client)}
            className="p-1.5 rounded-lg text-green-400 hover:text-green-600 hover:bg-green-50 transition"
            title="Reactivar"
          >
            <RotateCcw size={13} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(customer.id_client)}
            className="p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition ml-auto"
            title="Desactivar"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomerCard;
