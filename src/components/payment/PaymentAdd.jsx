import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

const PaymentAdd = ({ clientId, onSuccess }) => {
  const { supabase } = useApp();

  const [paymentsTypes, setPaymentsTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [payment, setPayment] = useState({
    created_at: new Date().toISOString(),
    Type: '',
    Amount: 0,
    TypeId: 0,
    ClientId: clientId,
  });

  const GetTypes = async () => {
    try {
      const { data, error } = await supabase
        .schema('operations')
        .from('PaymentsType')
        .select('*');

      if (error) throw error;

      setPaymentsTypes(data || []);
    } catch (error) {
      console.error('Error loading payment types:', error);
    }
  };

  const handleChange = (field, value) => {
    setPayment((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .schema('operations')
        .from('Payments')
        .insert([payment]);

      if (error) throw error;

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving payment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GetTypes();
  }, []);

  return (
    <div className="space-y-4 w-full max-w-md">
      <h2 className="text-lg font-semibold">Agregar Pago</h2>

      {/* Monto */}
      <div>
        <label className="text-sm text-gray-600">Monto</label>
        <input
          type="number"
          value={payment.Amount}
          onChange={(e) => handleChange('Amount', Number(e.target.value))}
          className="w-full mt-1 px-3 py-2 border rounded-lg"
        />
      </div>

      {/* Tipo */}
      <div>
        <label className="text-sm text-gray-600">Tipo de Pago</label>
        <select
          value={payment.TypeId}
          onChange={(e) => handleChange('TypeId', Number(e.target.value))}
          className="w-full mt-1 px-3 py-2 border rounded-lg"
        >
          <option value={0}>Seleccione...</option>
          {paymentsTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* Botón */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
};

export default PaymentAdd;