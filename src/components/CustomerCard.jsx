import { Pencil, Trash2, EyeIcon, RotateCcw, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE = {
  personal: { label: 'Personal', pill: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', accent: 'bg-blue-500' },
  family:   { label: 'Familiar', pill: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', accent: 'bg-purple-500' },
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition duration-200 flex flex-col">
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
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{customer.name}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${type.pill}`}>
              {type.label}
            </span>
            {customer.is_active === false && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400">
                Inactivo
              </span>
            )}
          </div>

          <div className="space-y-0.5 mt-1">
            {customer.phone && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Phone size={11} className="shrink-0 text-slate-400 dark:text-slate-500" />
                {customer.phone}
              </p>
            )}
            {customer.address_detail && (
              <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 truncate">
                <MapPin size={11} className="shrink-0 text-slate-300 dark:text-slate-600" />
                <span className="truncate">{customer.address_detail}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t border-slate-50 dark:border-slate-700">
        <Link
          to={`/cliente/${customer.id_client}`}
          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="Ver perfil"
        >
          <EyeIcon size={13} />
        </Link>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
        )}
        {onReactivate && (
          <button
            type="button"
            onClick={() => onReactivate(customer.id_client)}
            className="p-1.5 rounded-lg text-green-400 dark:text-green-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition"
            title="Reactivar"
          >
            <RotateCcw size={13} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(customer.id_client)}
            className="p-1.5 rounded-lg text-red-300 dark:text-red-500/70 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition ml-auto"
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
