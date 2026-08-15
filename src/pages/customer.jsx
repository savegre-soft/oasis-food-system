import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { sileo } from 'sileo';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle, Link2, Copy, RefreshCw } from 'lucide-react';
import OrdersSection from '../components/orders/OrdersSection';
import MacroPanel from '../components/MacroPanel';
import PaymentSection from '../components/PaymentsSection';
import AuthRoles from '../components/auth/AuthRoles';
import ConfirmDialog from '../components/ConfirmDialog';

// ── Constants ──────────────────────────────────────────────────────────────────

const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family: { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

const PLAN_TYPE = {
  estandar: { label: '⭐ Estándar', className: 'bg-slate-100 text-slate-600' },
  nutricional: { label: '🥗 Nutricional', className: 'bg-green-50 text-green-700' },
};

// ── Main page ──────────────────────────────────────────────────────────────────

const Customer = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmingRegen, setConfirmingRegen] = useState(false);

  const fetchData = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('clients')
      .select(
        `
        *,
        lunch_macro:macro_profiles!clients_lunch_macro_profile_id_fkey (
          id_macro_profile, name, protein_value, carb_value
        ),
        dinner_macro:macro_profiles!clients_dinner_macro_profile_id_fkey (
          id_macro_profile, name, protein_value, carb_value
        )
      `
      )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/portal/${customer.portal_token}`;
    navigator.clipboard.writeText(url);
    sileo.success('Enlace copiado');
  };

  const handleRegenerateLink = async () => {
    setRegenerating(true);
    const { error } = await supabase
      .schema('operations')
      .from('clients')
      .update({ portal_token: crypto.randomUUID(), portal_token_regenerated_at: new Date().toISOString() })
      .eq('id_client', Number(id));

    setRegenerating(false);
    setConfirmingRegen(false);

    if (error) {
      sileo.error('No se pudo regenerar el enlace');
      return;
    }
    sileo.success('Enlace regenerado');
    await fetchData();
  };

  if (loading) return <p className="p-8 text-slate-400">Cargando cliente...</p>;
  if (!customer) return <p className="p-8 text-slate-400">Cliente no encontrado</p>;

  const typeStyle = CLIENT_TYPE[customer.client_type] ?? CLIENT_TYPE.personal;
  const planStyle = customer.plan_type
    ? (PLAN_TYPE[customer.plan_type] ?? PLAN_TYPE.estandar)
    : null;
  const hasMap = customer.latitude && customer.longitude;
  const hasMacros = customer.lunch_macro || customer.dinner_macro;

  return (
    <AuthRoles rolesNames={['Administrador', 'Clientes']}>
      <ConfirmDialog
        open={confirmingRegen}
        title="¿Regenerar el enlace del portal?"
        message="El enlace anterior deja de funcionar de inmediato. Vas a tener que compartirle el nuevo enlace al cliente."
        confirmLabel={regenerating ? 'Regenerando...' : 'Regenerar enlace'}
        confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition disabled:opacity-50"
        onConfirm={handleRegenerateLink}
        onCancel={() => setConfirmingRegen(false)}
      />
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span
                  className={
                    'text-xs px-2.5 py-0.5 rounded-full ' +
                    (customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')
                  }
                >
                  {customer.is_active ? 'Activo' : 'Inactivo'}
                </span>
                <span className={'text-xs px-2.5 py-0.5 rounded-full ' + typeStyle.className}>
                  {typeStyle.label}
                </span>
                {planStyle && customer.client_type === 'personal' && (
                  <span className={'text-xs px-2.5 py-0.5 rounded-full ' + planStyle.className}>
                    {planStyle.label}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 text-sm text-slate-700 md:text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Contacto</p>
              {customer.phone && <p>📞 {customer.phone}</p>}
              {customer.address_detail && <p>📍 {customer.address_detail}</p>}
            </div>
          </div>
          {customer.created_at && (
            <p className="text-xs text-slate-400 mt-4">
              Cliente desde{' '}
              {new Date(customer.created_at).toLocaleDateString('es-CR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Portal de cliente */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
            <Link2 size={13} /> Portal de cliente
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="flex-1 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 truncate">
              {window.location.origin}/portal/{customer.portal_token}
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2.5 rounded-xl hover:border-slate-400 transition"
              >
                <Copy size={13} /> Copiar enlace
              </button>
              <button
                onClick={() => setConfirmingRegen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2.5 rounded-xl hover:border-amber-400 hover:text-amber-700 transition"
              >
                <RefreshCw size={13} /> Regenerar
              </button>
            </div>
          </div>
        </div>

        {/* Macros */}
        {customer.client_type === 'personal' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">Perfiles Nutricionales</p>
            {hasMacros ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MacroPanel label="☀️ Almuerzo" accent="amber" macro={customer.lunch_macro} />
                <MacroPanel label="🌙 Cena" accent="indigo" macro={customer.dinner_macro} />
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Sin perfil nutricional registrado</p>
            )}
          </div>
        )}

        {/* Pagos */}
        <PaymentSection clientId={Number(id)} />

        {/* Orders */}
        <OrdersSection clientId={Number(id)} />

        {/* Map */}
        {hasMap && (
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">Ubicación</p>
            <div className="rounded-xl overflow-hidden border">
              <MapContainer
                center={[customer.latitude, customer.longitude]}
                zoom={15}
                style={{ height: '260px', width: '100%' }}
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
    </AuthRoles>
  );
};

export default Customer;
