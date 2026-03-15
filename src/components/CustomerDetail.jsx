import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family:   { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

const PLAN_TYPE = {
  estandar:    { label: '⭐ Estándar',    className: 'bg-slate-100 text-slate-600' },
  nutricional: { label: '🥗 Nutricional', className: 'bg-green-50 text-green-700'  },
};

const MacroPanel = ({ label, accent, macro }) => {
  if (!macro) return null;
  const colors = {
    amber:  { border: 'border-amber-200', bg: 'bg-amber-50',  text: 'text-amber-700'  },
    indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  };
  const c = colors[accent];
  return (
    <div className={`rounded-xl border p-4 ${c.border} ${c.bg}`}>
      <p className={`text-xs font-semibold mb-3 ${c.text}`}>{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Proteína</p>
          <p className="text-sm font-semibold text-slate-800">
            {macro.protein_value} <span className="font-normal text-slate-500">{macro.protein_unit}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Carbohidratos</p>
          <p className="text-sm font-semibold text-slate-800">
            {macro.carb_value} <span className="font-normal text-slate-500">{macro.carb_unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const CustomerDetailModal = ({ customer, onClose }) => {
  const overlayRef = useRef(null);
  const typeStyle  = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;
  const planStyle  = customer.plan_type ? (PLAN_TYPE[customer.plan_type] ?? PLAN_TYPE.estandar) : null;
  const hasMap     = customer.latitude && customer.longitude;
  const hasMacros  = customer.lunch_macro || customer.dinner_macro;

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{customer.name}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {customer.is_active ? 'Activo' : 'Inactivo'}
              </span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${typeStyle.className}`}>
                {typeStyle.label}
              </span>
              {planStyle && customer.client_type === 'personal' && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${planStyle.className}`}>
                  {planStyle.label}
                </span>
              )}
            </div>
          </div>
           <a
      href={`/cliente/${customer.id_client}`}
      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
    >
      Ver perfil
    </a>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100 shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Contacto */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contacto</p>
            {customer.phone && (
              <p className="text-sm text-slate-700">📞 {customer.phone}</p>
            )}
            {customer.address_detail && (
              <p className="text-sm text-slate-700">📍 {customer.address_detail}</p>
            )}
            <p className="text-sm text-slate-700">
              📅 {customer.client_type === 'family'
                ? 'Entrega los Viernes'
                : 'Dom + Mar o Dom + Mié según pedido'}
            </p>
          </div>

          {/* Perfiles nutricionales */}
          {customer.client_type === 'personal' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Perfiles Nutricionales</p>
              {hasMacros ? (
                <div className="grid grid-cols-2 gap-3">
                  <MacroPanel label="☀️ Almuerzo" accent="amber"  macro={customer.lunch_macro}  />
                  <MacroPanel label="🌙 Cena"     accent="indigo" macro={customer.dinner_macro} />
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Sin perfil nutricional registrado</p>
              )}
            </div>
          )}

          {/* Mapa */}
          {hasMap && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ubicación</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <MapContainer
                  center={[customer.latitude, customer.longitude]}
                  zoom={15}
                  style={{ height: '220px', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[customer.latitude, customer.longitude]} />
                </MapContainer>
              </div>
              <p className="text-xs text-slate-400 text-center">
                {customer.latitude.toFixed(6)}, {customer.longitude.toFixed(6)}
              </p>
            </div>
          )}

          {/* Fecha */}
          {customer.created_at && (
            <p className="text-xs text-slate-400">
              Cliente desde {new Date(customer.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomerDetailModal;