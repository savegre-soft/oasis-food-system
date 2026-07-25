import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sileo } from 'sileo';

// batch: fila de bulk_sale_batches con bulk_dishes(name, suggested_price) anidado.
// clients: lista completa de clientes (id_client, name), para el buscador opcional.
const AddBulkSaleEntry = ({ batch, clients, leftover, onSuccess }) => {
  const { supabase } = useApp();
  const dish = batch.bulk_dishes;
  const suggestedPrice = dish?.suggested_price;

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [manualAmount, setManualAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mientras el admin no edite el monto a mano, se deriva de cantidad ×
  // precio sugerido; en cuanto lo toca, queda fijo aunque cambie la cantidad.
  const amount = amountTouched
    ? manualAmount
    : suggestedPrice != null
      ? String(Number(quantity || 0) * Number(suggestedPrice))
      : '';

  const filteredClients =
    clientSearch.trim() === ''
      ? []
      : clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 6);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity === '' || Number(quantity) <= 0) {
      sileo.error('Ingresa la cantidad vendida');
      return;
    }
    if (amount === '' || Number(amount) < 0) {
      sileo.error('Ingresa el monto de la venta');
      return;
    }
    setLoading(true);

    const { data: paymentData, error: paymentError } = await supabase
      .schema('operations')
      .from('payments')
      .insert([
        {
          client_id: selectedClient?.id_client ?? null,
          payment_type: 'bulk',
          amount: Number(amount),
          currency: 'CRC',
          payment_date: batch.batch_date,
          status: 'paid',
          notes: `Venta masiva: ${dish?.name ?? ''}`,
        },
      ])
      .select('id_payment')
      .single();

    if (paymentError) {
      sileo.error('Error al registrar el ingreso');
      console.error(paymentError);
      setLoading(false);
      return;
    }

    const { error: entryError } = await supabase
      .schema('operations')
      .from('bulk_sale_entries')
      .insert([
        {
          batch_id: batch.id_bulk_sale_batch,
          client_id: selectedClient?.id_client ?? null,
          quantity: Number(quantity),
          amount: Number(amount),
          payment_id: paymentData.id_payment,
        },
      ]);

    if (entryError) {
      // El pago ya se creó — se revierte para no dejar un ingreso huérfano.
      await supabase.schema('operations').from('payments').delete().eq('id_payment', paymentData.id_payment);
      sileo.error('Error al registrar la venta');
      console.error(entryError);
      setLoading(false);
      return;
    }

    sileo.success('Venta registrada');
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Registrar venta</h2>
      <p className="text-sm text-slate-500 mb-6">
        {dish?.name} {leftover != null && <span className="text-slate-400">· sobrante: {leftover}</span>}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Cliente <span className="text-slate-400 font-normal">(opcional — dejar vacío si es venta general)</span>
          </label>
          {selectedClient ? (
            <div className="flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50">
              <span className="text-slate-700">{selectedClient.name}</span>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Buscar cliente…"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                spellCheck="false"
                autoComplete="off"
              />
              {filteredClients.length > 0 && (
                <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id_client}
                      type="button"
                      onClick={() => {
                        setSelectedClient(c);
                        setClientSearch('');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Monto (₡)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => {
                setManualAmount(e.target.value);
                setAmountTouched(true);
              }}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-800 text-white py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Guardando...' : 'Registrar venta'}
        </button>
      </form>
    </div>
  );
};

export default AddBulkSaleEntry;
