import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const AddCustomer = ({ onAdd }) => {
  const { supabase } = useApp();

  // Formulario
  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
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

  // Filtrado dependiente
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
          country_id: selectedCountry || null,
          province_id: selectedProvince || null,
          canton_id: selectedCanton || null,
          district_id: selectedDistrict || null,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
    } else {
      setNombre('');
      setPhone('');
      setAddress('');
      setSelectedCountry('');
      setSelectedProvince('');
      setSelectedCanton('');
      setSelectedDistrict('');
      setErrorMsg('');
      if (onAdd) onAdd(data);
    }
  };

  const selectClass =
    'p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  return (
    <div className="p-8 bg-slate-100 ">
      <h1 className="text-2xl font-bold mb-6">Agregar Cliente</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md"
      >
        {errorMsg && <p className="text-red-500">{errorMsg}</p>}

        {/* Inputs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={selectClass}
            required
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={selectClass}
          />
        </div>

        <input
          type="text"
          placeholder="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={selectClass}
        />

        {/* Localización: País / Provincia / Cantón / Distrito */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Botón de submit */}
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition w-full md:w-auto"
        >
          Agregar
        </button>
      </form>
    </div>
  );
};

export default AddCustomer;
