import { useState } from 'react';
import { sileo } from 'sileo';
import Modal from '../Modal';
import { useApp } from '../../context/AppContext';

const ManualIncomeModal = ({ onClose, onSuccess }) => {
  const { supabase } = useApp();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);

  const canSubmit = description.trim() !== '' && amount !== '' && Number(amount) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const { error } = await supabase
      .schema('operations')
      .from('payments')
      .insert([
        {
          client_id: null,
          payment_type: 'other',
          amount: Number(amount),
          currency: 'CRC',
          payment_date: paymentDate,
          status,
          notes: description.trim(),
        },
      ]);

    setLoading(false);

    if (error) {
      sileo.error('No se pudo registrar el ingreso manual');
      console.error(error);
      return;
    }

    sileo.success('Ingreso registrado');
    if (onSuccess) onSuccess();
  };

  return (
    <Modal isOpen onClose={onClose}>
      <div className="space-y-5 max-w-md">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Registrar ingreso manual</h2>
          <p className="text-sm text-slate-500 mt-1">
            Para ingresos que no provienen de una orden de cliente (ej. ventas puntuales, otros servicios).
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Descripción
          </label>
          <textarea
            rows={2}
            placeholder="Ej. Venta de postres en evento externo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Monto (₡)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Fecha
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Estado
          </label>
          <div className="flex gap-2">
            {[
              ['pending', 'Pendiente'],
              ['cancelled', 'Cancelado'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatus(val)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  status === val
                    ? val === 'pending'
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                      : 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Registrar ingreso'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ManualIncomeModal;
