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

const AddCustomer = ({ onAdd }) => {
  const { supabase } = useApp();

  // Formulario
  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Localización
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cantons, setCantons] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCanton, setSelectedCanton] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data: countryData } = await supabase
          .schema('operations')
          .from('countries')
          .select('*');
        setCountries(countryData || []);

        const { data: provinceData } = await supabase
          .schema('operations')
          .from('provinces')
          .select('*');
        setProvinces(provinceData || []);

        const { data: cantonData } = await supabase
          .schema('operations')
          .from('cantons')
          .select('*');
        setCantons(cantonData || []);

        const { data: districtData } = await supabase
          .schema('operations')
          .from('districts')
          .select('*');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre) return;

    const { data, error } = await supabase
      .schema('operations')
      .from('clients')
      .insert([
        {
          name: nombre,
          phone,
          address_detail: address,
          district_id: selectedDistrict || null,
          latitude,
          longitude,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      return;
    }

    sileo.success('Cliente agregado exitosamente');

    setNombre('');
    setPhone('');
    setAddress('');
    setSelectedCountry('');
    setSelectedProvince('');
    setSelectedCanton('');
    setSelectedDistrict('');
    setLatitude(null);
    setLongitude(null);
    setErrorMsg('');
    onAdd();
  };

  const selectClass =
    'p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  return (
    <div className="min-h-screen p-8 bg-slate-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Agregar Cliente</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-8 flex flex-col gap-6"
      >
        {errorMsg && <p className="text-red-500 font-medium">{errorMsg}</p>}

        {/* Sección: Datos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700">Nombre del cliente</label>
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={selectClass}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700">Teléfono</label>
            <input
              type="text"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={selectClass}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-semibold text-gray-700">Dirección</label>
          <input
            type="text"
            placeholder="Dirección"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={selectClass}
          />
        </div>

        {/* Sección: Localización */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/** País */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">País</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedProvince('');
                setSelectedCanton('');
                setSelectedDistrict('');
              }}
              className={selectClass}
            >
              <option value="">Seleccionar país</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/** Provincia */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Provincia</label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setSelectedCanton('');
                setSelectedDistrict('');
              }}
              className={selectClass}
              disabled={!selectedCountry}
            >
              <option value="">Seleccionar provincia</option>
              {filteredProvinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/** Cantón */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Cantón</label>
            <select
              value={selectedCanton}
              onChange={(e) => {
                setSelectedCanton(e.target.value);
                setSelectedDistrict('');
              }}
              className={selectClass}
              disabled={!selectedProvince}
            >
              <option value="">Seleccionar cantón</option>
              {filteredCantons.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/** Distrito */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Distrito</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className={selectClass}
              disabled={!selectedCanton}
            >
              <option value="">Seleccionar distrito</option>
              {filteredDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sección: Mapa GPS */}
        <div className="flex flex-col mt-4">
          <label className="mb-2 font-semibold text-gray-700">Ubicación en el mapa</label>
          <div className="border rounded-xl overflow-hidden shadow-md">
            <MapContainer
              center={[9.9333, -84.0833]}
              zoom={10}
              style={{ height: '350px', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker
                position={latitude && longitude ? [latitude, longitude] : null}
                setPosition={(pos) => {
                  setLatitude(pos[0]);
                  setLongitude(pos[1]);
                }}
              />
            </MapContainer>
          </div>
          {latitude && longitude && (
            <p className="mt-2 text-sm text-slate-600">
              Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
            </p>
          )}
        </div>

        {/* Botón */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition w-full md:w-1/3"
          >
            Agregar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomer;
