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

const PlanToggle = ({ value, onChange, name }) => (
  <div className="flex rounded-xl overflow-hidden border border-slate-200 text-xs font-medium">
    {[
      { v: 'estandar',    label: '⭐ Estándar'   },
      { v: 'nutricional', label: '🥗 Nutricional' },
    ].map((opt) => (
      <label key={opt.v}
        className={`flex items-center px-3 py-1.5 cursor-pointer transition select-none ${
          value === opt.v
            ? 'bg-slate-800 text-white'
            : 'bg-white text-slate-500 hover:bg-slate-50'
        }`}
      >
        <input type="radio" name={name} value={opt.v} checked={value === opt.v}
          onChange={() => onChange(opt.v)} className="sr-only" />
        {opt.label}
      </label>
    ))}
  </div>
);

const AddCustomer = ({ onAdd }) => {
  const { supabase } = useApp();

  // Cliente
  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [clientType, setClientType] = useState('personal'); // 'personal' | 'family'
  const [lunchPlanType,  setLunchPlanType]  = useState('nutricional'); // 'estandar' | 'nutricional'
  const [dinnerPlanType, setDinnerPlanType] = useState('nutricional'); // 'estandar' | 'nutricional'
  const [errorMsg, setErrorMsg] = useState('');

  // Macros — almuerzo
  const [lunchProtein, setLunchProtein] = useState('');
  const [lunchProteinUnit, setLunchProteinUnit] = useState('g');
  const [lunchCarb, setLunchCarb] = useState('');
  const [lunchCarbUnit, setLunchCarbUnit] = useState('g');
  // Macros — cena
  const [dinnerProtein, setDinnerProtein] = useState('');
  const [dinnerProteinUnit, setDinnerProteinUnit] = useState('g');
  const [dinnerCarb, setDinnerCarb] = useState('');
  const [dinnerCarbUnit, setDinnerCarbUnit] = useState('g');

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

  const STANDARD_MACRO = '120';
  const isStandard = (p, c) => String(p) === STANDARD_MACRO && String(c) === STANDARD_MACRO;

  const handleLunchPlanChange = (value) => {
    setLunchPlanType(value);
    if (value === 'estandar') {
      setLunchProtein(STANDARD_MACRO); setLunchProteinUnit('g');
      setLunchCarb(STANDARD_MACRO);    setLunchCarbUnit('g');
    }
  };

  const handleDinnerPlanChange = (value) => {
    setDinnerPlanType(value);
    if (value === 'estandar') {
      setDinnerProtein(STANDARD_MACRO); setDinnerProteinUnit('g');
      setDinnerCarb(STANDARD_MACRO);    setDinnerCarbUnit('g');
    }
  };

  const handleLunchMacroChange = (field, value) => {
    const newProtein = field === 'protein' ? value : lunchProtein;
    const newCarb    = field === 'carb'    ? value : lunchCarb;
    if (field === 'protein') setLunchProtein(value);
    if (field === 'carb')    setLunchCarb(value);
    setLunchPlanType(isStandard(newProtein, newCarb) ? 'estandar' : 'nutricional');
  };

  const handleDinnerMacroChange = (field, value) => {
    const newProtein = field === 'protein' ? value : dinnerProtein;
    const newCarb    = field === 'carb'    ? value : dinnerCarb;
    if (field === 'protein') setDinnerProtein(value);
    if (field === 'carb')    setDinnerCarb(value);
    setDinnerPlanType(isStandard(newProtein, newCarb) ? 'estandar' : 'nutricional');
  };

  // Derived plan_type for DB: estandar only if both meals are standard
  const derivedPlanType = lunchPlanType === 'estandar' && dinnerPlanType === 'estandar'
    ? 'estandar' : 'nutricional';

  const resetForm = () => {
    setNombre('');
    setPhone('');
    setAddress('');
    setClientType('personal');
    setLunchPlanType('nutricional');
    setDinnerPlanType('nutricional');
    setSelectedCountry('');
    setSelectedProvince('');
    setSelectedCanton('');
    setSelectedDistrict('');
    setLatitude(null);
    setLongitude(null);
    setLunchProtein(''); setLunchProteinUnit('g');
    setLunchCarb(''); setLunchCarbUnit('g');
    setDinnerProtein(''); setDinnerProteinUnit('g');
    setDinnerCarb(''); setDinnerCarbUnit('g');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      let lunchProfileId = null;
      let dinnerProfileId = null;

      if (clientType === 'personal') {
        // 1a. Crear perfil de almuerzo
        const { data: lunchData, error: lunchError } = await supabase
          .schema('operations')
          .from('macro_profiles')
          .insert([{
            name: `${nombre.trim()} — Almuerzo`,
            protein_value: parseFloat(lunchProtein),
            protein_unit: lunchProteinUnit,
            carb_value: parseFloat(lunchCarb),
            carb_unit: lunchCarbUnit,
            is_active: true,
          }])
          .select('id_macro_profile')
          .single();

        if (lunchError) {
          sileo.error('Error al guardar el perfil de almuerzo');
          console.error(lunchError);
          setLoading(false);
          return;
        }
        lunchProfileId = lunchData.id_macro_profile;

        // 1b. Crear perfil de cena
        const { data: dinnerData, error: dinnerError } = await supabase
          .schema('operations')
          .from('macro_profiles')
          .insert([{
            name: `${nombre.trim()} — Cena`,
            protein_value: parseFloat(dinnerProtein),
            protein_unit: dinnerProteinUnit,
            carb_value: parseFloat(dinnerCarb),
            carb_unit: dinnerCarbUnit,
            is_active: true,
          }])
          .select('id_macro_profile')
          .single();

        if (dinnerError) {
          sileo.error('Error al guardar el perfil de cena');
          console.error(dinnerError);
          setLoading(false);
          return;
        }
        dinnerProfileId = dinnerData.id_macro_profile;
      }

      // 2. Crear cliente
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
          lunch_macro_profile_id: lunchProfileId,
          dinner_macro_profile_id: dinnerProfileId,
          client_type: clientType,
          plan_type: derivedPlanType,
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

          {/* Perfiles Nutricionales — solo para clientes personales */}
          {clientType === 'personal' && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Perfiles Nutricionales
              </h2>

              {/* Almuerzo */}
              <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-amber-700">☀️ Almuerzo</p>
                  <PlanToggle value={lunchPlanType} onChange={handleLunchPlanChange} name="lunchPlan" />
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={labelClass}>Proteína</label>
                    <div className="flex gap-2">
                      <input type="number" min="0" value={lunchProtein} onChange={(e) => handleLunchMacroChange('protein', e.target.value)} className={inputClass} placeholder="Ej: 200" required />
                      <select value={lunchProteinUnit} onChange={(e) => setLunchProteinUnit(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm bg-white">
                        {MACRO_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Carbohidratos</label>
                    <div className="flex gap-2">
                      <input type="number" min="0" value={lunchCarb} onChange={(e) => handleLunchMacroChange('carb', e.target.value)} className={inputClass} placeholder="Ej: 150" required />
                      <select value={lunchCarbUnit} onChange={(e) => setLunchCarbUnit(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm bg-white">
                        {MACRO_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cena */}
              <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-indigo-700">🌙 Cena</p>
                  <PlanToggle value={dinnerPlanType} onChange={handleDinnerPlanChange} name="dinnerPlan" />
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={labelClass}>Proteína</label>
                    <div className="flex gap-2">
                      <input type="number" min="0" value={dinnerProtein} onChange={(e) => handleDinnerMacroChange('protein', e.target.value)} className={inputClass} placeholder="Ej: 150" required />
                      <select value={dinnerProteinUnit} onChange={(e) => setDinnerProteinUnit(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm bg-white">
                        {MACRO_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Carbohidratos</label>
                    <div className="flex gap-2">
                      <input type="number" min="0" value={dinnerCarb} onChange={(e) => handleDinnerMacroChange('carb', e.target.value)} className={inputClass} placeholder="Ej: 100" required />
                      <select value={dinnerCarbUnit} onChange={(e) => setDinnerCarbUnit(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition text-sm bg-white">
                        {MACRO_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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