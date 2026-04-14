const StepPayment = ({
  paymentType,
  setPaymentType,
  paymentAmount,
  setPaymentAmount,
  paymentDate,
  setPaymentDate,
  paymentStatus,
  setPaymentStatus,
  paymentNotes,
  setPaymentNotes,
  availableMonthly,
  associatePaymentId,
  setAssociatePaymentId,
}) => (
  <div className="space-y-5">
    <p className="text-sm text-slate-500">Registra el pago asociado a este pedido.</p>

    {/* Available monthly payments */}
    {paymentType === 'monthly' && availableMonthly.length > 0 && (
      <div className="border border-violet-200 bg-violet-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
          Pago mensual disponible
        </p>
        <p className="text-xs text-violet-600">
          Este cliente tiene pagos mensuales con espacio disponible. Puedes asociar esta orden a uno
          existente en lugar de crear un pago nuevo.
        </p>
        <div className="space-y-1.5 mt-1">
          {availableMonthly.map((mp) => {
            const used = mp.payment_orders?.length ?? 0;
            const isSelected = associatePaymentId === mp.id_payment;
            const [y, m, d] = mp.payment_date.split('-');
            return (
              <button
                key={mp.id_payment}
                type="button"
                onClick={() => setAssociatePaymentId(isSelected ? null : mp.id_payment)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition ${
                  isSelected
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-white border-violet-200 text-slate-700 hover:border-violet-400'
                }`}
              >
                <span className="font-medium">₡{Number(mp.amount).toLocaleString()}</span>
                <span className={`ml-2 text-xs ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>
                  {d}/{m}/{y} · {used}/4 órdenes
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setAssociatePaymentId(null)}
          className={`text-xs underline transition ${
            associatePaymentId === null
              ? 'text-violet-800 font-semibold'
              : 'text-violet-500 hover:text-violet-700'
          }`}
        >
          Crear nuevo pago
        </button>
      </div>
    )}

    {/* New payment form */}
    {associatePaymentId === null && (
      <>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Tipo de pago
          </label>
          <div className="flex gap-2">
            {[
              ['monthly', 'Mensual'],
              ['weekly', 'Semanal'],
              ['express', 'Express'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setPaymentType(val);
                  setAssociatePaymentId(null);
                }}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  paymentType === val
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {paymentType === 'monthly'
              ? 'Cubre hasta 4 órdenes del mes'
              : paymentType === 'weekly'
                ? 'Cubre 1 orden semanal'
                : 'Entrega del día, cobro inmediato'}
          </p>
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
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Fecha de pago
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                onClick={() => setPaymentStatus(val)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  paymentStatus === val
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

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Notas <span className="normal-case text-slate-400">(opcional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Observaciones del pago…"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
          />
        </div>
      </>
    )}
  </div>
);

export default StepPayment;
