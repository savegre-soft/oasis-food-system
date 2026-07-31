import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal';

// Formulario del monto del extra. Se remonta (via `key`, puesto por el padre)
// cada vez que cambia el ítem/unidad pendiente, para que el input arranque
// precargado con el último precio usado sin depender de un efecto.
const ComboExtraChargeForm = ({ pending, onConfirm, onCancel }) => {
  const [amount, setAmount] = useState(
    pending.defaultAmount != null ? String(pending.defaultAmount) : ''
  );

  const numericAmount = Number(amount);
  const isValid = amount !== '' && !Number.isNaN(numericAmount) && numericAmount > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(numericAmount);
  };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <AlertTriangle size={20} />
        <h3 className="text-base font-bold">Esto es un extra</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Ya se alcanzó el máximo de selecciones del combo. Agregar{' '}
        {pending.unitNumber > 1 ? `otra unidad de ` : ''}
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {pending.itemName}
        </span>{' '}
        {pending.unitNumber > 1 ? `(unidad extra #${pending.unitNumber})` : ''} se registrará como
        un extra y se cobrará aparte. ¿Cuánto se le va a cobrar?
      </p>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
          Monto del extra (₡)
        </label>
        <input
          type="number"
          min="0"
          step="any"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
          }}
          placeholder="0"
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-600"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={handleConfirm}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Agregar como extra
        </button>
      </div>
    </div>
  );
};

// Se abre cada vez que el usuario suma una unidad que excede el máximo de
// selecciones configurado para el combo de esa semana. Pide el monto a
// cobrar por ESA unidad antes de agregarla al pedido; se puede volver a abrir
// para seguir agregando más unidades extra del mismo ítem (o de otros).
// pending: { category, itemId, itemName, unitNumber, defaultAmount } | null
const ComboExtraChargeModal = ({ pending, onConfirm, onCancel }) => (
  <Modal isOpen={!!pending} onClose={onCancel}>
    {pending && (
      <ComboExtraChargeForm
        key={`${pending.category}:${pending.itemId}:${pending.unitNumber}`}
        pending={pending}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )}
  </Modal>
);

export default ComboExtraChargeModal;
