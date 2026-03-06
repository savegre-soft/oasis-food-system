import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { sileo } from 'sileo';

// Icono del marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const MACRO_UNITS = ['g', 'oz', 'kg'];

const AddCustomer = ({ onAdd }) => {
  const { supabase } = useApp();

  // Cliente
  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [clientType, setClientType] = useState('personal'); // 'personal' | 'family'
  const [errorMsg, setErrorMsg] = useState('');

  // Macro profile
  const [macroProfileName, setMacroProfileName] = useState('');
  const [proteinValue, setProteinValue] = useState('');
  const [proteinUnit, setProteinUnit] = useState('g');
  const [carbValue, setCarbValue] = useState('');
  const [carbUnit, setCarbUnit] = useState('g');

  // Localización
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cantons, setCantons] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCanton, setSelectedCanton] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data: countryData } = await supabase.schema('operations').from('countries').select('*');
        setCountries(countryData || []);
        const { data: provinceData } = await supabase.schema('operations').from('provinces').select('*');
        setProvinces(provinceData || []);
        const { data: cantonData } = await supabase.schema('operations').from('cantons').select('*');
        setCantons(cantonData || []);
        const { data: districtData } = await supabase.schema('operations').from('districts').select('*');
        setDistricts(districtData || []);
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };
    fetchLocations();
  }, [supabase]);

  const filteredProvinces = provinces.filter((p) => p.country_id === Number(selectedCountry));
  const filteredCantons = cantons.filter((c) => c.province_id === Number(selectedProvince));
  const filteredDistricts = districts.filter((d) => d.canton_id === Number(selectedCanton));

  const resetForm = () => {
    setNombre('');
    setPhone('');
    setAddress('');
    setClientType('personal');
    setSelectedCountry('');
    setSelectedProvince('');
    setSelectedCanton('');
    setSelectedDistrict('');
    setLatitude(null);
    setLongitude(null);
    setMacroProfileName('');
    setProteinValue('');
    setProteinUnit('g');
    setCarbValue('');
    setCarbUnit('g');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Crear macro profile
      const { data: macroData, error: macroError } = await supabase
        .schema('operations')
        .from('macro_profiles')
        .insert([{
          name: macroProfileName.trim(),
          protein_value: parseFloat(proteinValue),
          protein_unit: proteinUnit,
          carb_value: parseFloat(carbValue),
          carb_unit: carbUnit,
          is_active: true,
        }])
        .select('id_macro_profile')
        .single();

      if (macroError) {
        sileo.error('Error al guardar el perfil nutricional');
        console.error(macroError);
        setLoading(false);
        return;
      }

      // 2. Crear cliente con client_type
      const { error: clientError } = await supabase
        .schema('operations')
        .from('clients')
        .insert([{
          name: nombre,
          phone,
          address_detail: address,
          district_id: selectedDistrict || null,
          latitude,
          longitude,
          macro_profile_id: macroData.id_macro_profile,
          client_type: clientType,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (clientError) {
        sileo.error('Error al guardar el cliente');
        console.error(clientError);
        setErrorMsg(clientError.message);
        setLoading(false);
        return;
      }

      sileo.success('Cliente agregado exitosamente');
      resetForm();
      if (onAdd) onAdd();

    } catch (err) {
      console.error(err);
      sileo.error('Error inesperado');
    }

    setLoading(false);
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm';
  const labelClass = 'block text-sm font-medium text-slate-600 mb-1';

  return (
    <div className="p-8 bg-slate-50 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Agregar Cliente</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {errorMsg && (
          <p className="text-red-500 font-medium lg:col-span-2">{errorMsg}</p>
        )}

        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="flex flex-col gap-6">

          {/* Tipo de cliente */}
          <div>
            <label className={labelClass}>Tipo de cliente</label>
            <div className="flex gap-2 mt-1">
              {[
                { value: 'personal', label: '👤 Personal', desc: 'Entregas Dom + Mar o Dom + Mié' },
                { value: 'family',   label: '👨‍👩‍👧 Familiar',  desc: 'Entrega solo los Viernes' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setClientType(opt.value)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-left transition ${
                    clientType === opt.value
                      ? opt.value === 'family'
                        ? 'bg-purple-50 border-purple-400 text-purple-900'
                        : 'bg-blue-50 border-blue-400 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Datos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre del cliente</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="Ej: 8888-8888"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder="Ej: 100m norte del parque"
            />
          </div>

          {/* Localización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>País</label>
              <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedProvince(''); setSelectedCanton(''); setSelectedDistrict(''); }} className={inputClass}>
                <option value="">Seleccionar país</option>
                {countries.map((c) => <option key={c.id_country} value={c.id_country}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Provincia</label>
              <select value={selectedProvince} onChange={(e) => { setSelectedProvince(e.target.value); setSelectedCanton(''); setSelectedDistrict(''); }} className={inputClass} disabled={!selectedCountry}>
                <option value="">Seleccionar provincia</option>
                {filteredProvinces.map((p) => <option key={p.id_province} value={p.id_province}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cantón</label>
              <select value={selectedCanton} onChange={(e) => { setSelectedCanton(e.target.value); setSelectedDistrict(''); }} className={inputClass} disabled={!selectedProvince}>
                <option value="">Seleccionar cantón</option>
                {filteredCantons.map((c) => <option key={c.id_canton} value={c.id_canton}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Distrito</label>
              <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className={inputClass} disabled={!selectedCanton}>
                <option value="">Seleccionar distrito</option>
                {filteredDistricts.map((d) => <option key={d.id_district} value={d.id_district}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* Perfil Nutricional */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
              Perfil Nutricional
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Nombre del perfil</label>
                <input type="text" value={macroProfileName} onChange={(e) => setMacroProfileName(e.target.value)} className={inputClass} placeholder="Ej: Perfil A — Alta proteína" required />
              </div>
              <div>
                <label className={labelClass}>Proteína</label>
                <div className="flex gap-2">
                  <input type="number" min="0" value={proteinValue} onChange={(e) => setProteinValue(e.target.value)} className={inputClass} placeholder="Ej: 150" required />
                  <select value={proteinUnit} onChange={(e) => setProteinUnit(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm bg-white">
                    {MACRO_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Carbohidratos</label>
                <div className="flex gap-2">
                  <input type="number" min="0" value={carbValue} onChange={(e) => setCarbValue(e.target.value)} className={inputClass} placeholder="Ej: 200" required />
                  <select value={carbUnit} onChange={(e) => setCarbUnit(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm bg-white">
                    {MACRO_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>

        {/* ── COLUMNA DERECHA — MAPA ── */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-slate-600 text-sm">Ubicación en el mapa</label>
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1">
            <MapContainer center={[9.9333, -84.0833]} zoom={10} style={{ height: '100%', minHeight: '420px', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker
                position={latitude && longitude ? [latitude, longitude] : null}
                setPosition={(pos) => { setLatitude(pos[0]); setLongitude(pos[1]); }}
              />
            </MapContainer>
          </div>
          {latitude && longitude && (
            <p className="mt-2 text-xs text-slate-500">Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddCustomer;