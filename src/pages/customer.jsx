import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';

const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family: { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

const PLAN_TYPE = {
  estandar: { label: '⭐ Estándar', className: 'bg-slate-100 text-slate-600' },
  nutricional: { label: '🥗 Nutricional', className: 'bg-green-50 text-green-700' },
};

const MacroPanel = ({ label, accent, macro }) => {
  if (!macro) return null;

  const colors = {
    amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
    indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  };

  const c = colors[accent];

  return (
    <div className={`rounded-xl border p-4 ${c.border} ${c.bg}`}>
      <p className={`text-xs font-semibold mb-3 ${c.text}`}>{label}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500">Proteína</p>
          <p className="text-sm font-semibold text-slate-800">
            {macro.protein_value} {macro.protein_unit}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Carbohidratos</p>
          <p className="text-sm font-semibold text-slate-800">
            {macro.carb_value} {macro.carb_unit}
          </p>
        </div>
      </div>
    </div>
  );
};

const Customer = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('clients')
      .select(`
        *,
        lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey (
          id_macro_profile,
          name,
          protein_value,
          protein_unit,
          carb_value,
          carb_unit
        ),
        dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey (
          id_macro_profile,
          name,
          protein_value,
          protein_unit,
          carb_value,
          carb_unit
        )
      `)
      .eq('id_client', Number(id))
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setCustomer(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <p className="p-8">Cargando cliente...</p>;
  if (!customer) return <p className="p-8">Cliente no encontrado</p>;

  const typeStyle = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;
  const planStyle = customer.plan_type
    ? PLAN_TYPE[customer.plan_type] ?? PLAN_TYPE.estandar
    : null;

  const hasMap = customer.latitude && customer.longitude;
  const hasMacros = customer.lunch_macro || customer.dinner_macro;

  return (
<div className="p-8 max-w-5xl mx-auto space-y-6">

  {/* HEADER COMPLETO */}
  <div className="bg-white border rounded-2xl p-6 shadow-sm">

    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

      {/* Información principal */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>

        <div className="flex gap-2 mt-2 flex-wrap">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full ${
              customer.is_active
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {customer.is_active ? "Activo" : "Inactivo"}
          </span>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full ${typeStyle.className}`}
          >
            {typeStyle.label}
          </span>

          {planStyle && customer.client_type === "personal" && (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full ${planStyle.className}`}
            >
              {planStyle.label}
            </span>
          )}
        </div>
      </div>

      {/* Contacto */}
      <div className="space-y-1 text-sm text-slate-700 md:text-right">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
          Contacto
        </p>

        {customer.phone && <p>📞 {customer.phone}</p>}

        {customer.address_detail && <p>📍 {customer.address_detail}</p>}
      </div>
    </div>

    {/* Fecha */}
    {customer.created_at && (
      <p className="text-xs text-slate-400 mt-4">
        Cliente desde{" "}
        {new Date(customer.created_at).toLocaleDateString("es-CR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
    )}
  </div>

  {/* Macros */}
  {customer.client_type === "personal" && (
    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase">
        Perfiles Nutricionales
      </p>

      {hasMacros ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MacroPanel
            label="☀️ Almuerzo"
            accent="amber"
            macro={customer.lunch_macro}
          />
          <MacroPanel
            label="🌙 Cena"
            accent="indigo"
            macro={customer.dinner_macro}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">
          Sin perfil nutricional registrado
        </p>
      )}
    </div>
  )}

  {/* Mapa */}
  {hasMap && (
    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase">
        Ubicación
      </p>

      <div className="rounded-xl overflow-hidden border">
        <MapContainer
          center={[customer.latitude, customer.longitude]}
          zoom={15}
          style={{ height: "260px", width: "100%" }}
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

</div>

  );
};

export default Customer;
