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
  explicitNewPayment,
  setExplicitNewPayment,
}) => {
  const hasMonthlyOptions = paymentType === 'monthly' && availableMonthly.length > 0;
  const showNewPaymentForm = associatePaymentId === null && (!hasMonthlyOptions || explicitNewPayment);

  return (
  <div className="space-y-5">
    <p className="text-sm text-slate-500 dark:text-slate-400">
      Registra el pago asociado a este pedido.
    </p>

    {/* Available monthly payments */}
    {hasMonthlyOptions && (
      <div className="border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide">
          Pago mensual disponible
        </p>
        <p className="text-xs text-violet-600 dark:text-violet-400/80">
          Este cliente tiene pagos mensuales con espacio disponible. Puedes asociar esta orden a uno
          existente en lugar de crear un pago nuevo.
        </p>
        <div className="space-y-1.5 mt-1">
          {availableMonthly.map((mp) => {
            const used = mp.payment_orders?.length ?? 0;
            const isSelected = associatePaymentId === mp.id_payment;
            const fmt = (str) => {
              if (!str) return '?';
              const [y, m, d] = str.split('-');
              return `${d}/${m}/${y}`;
            };
            return (
              <button
                key={mp.id_payment}
                type="button"
                onClick={() => {
                  setAssociatePaymentId(isSelected ? null : mp.id_payment);
                  setExplicitNewPayment(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition ${
                  isSelected
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800 text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-600'
                }`}
              >
                <span className="font-medium">₡{Number(mp.amount).toLocaleString()}</span>
                <span className={`ml-2 text-xs ${isSelected ? 'text-violet-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {fmt(mp.period_start_date)} – {fmt(mp.period_end_date)} · {used}/4 órdenes
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setAssociatePaymentId(null);
            setExplicitNewPayment(true);
          }}
          className={`text-xs underline transition ${
            explicitNewPayment
              ? 'text-violet-800 dark:text-violet-400 font-semibold'
              : 'text-violet-500 dark:text-violet-500 hover:text-violet-700 dark:hover:text-violet-300'
          }`}
        >
          Crear nuevo pago
        </button>
      </div>
    )}

    {/* New payment form */}
    {showNewPaymentForm && (
      <>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
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
                    ? 'bg-slate-800 dark:bg-indigo-600 text-white border-slate-800 dark:border-indigo-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {paymentType === 'monthly'
              ? 'Cubre hasta 4 órdenes del mes'
              : paymentType === 'weekly'
                ? 'Cubre 1 orden semanal'
                : 'Entrega del día, cobro inmediato'}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Monto (₡)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Estado
          </label>
          <div className="flex gap-2">
            {[
              ['pending', 'Pendiente'],
              ['paid', 'Pagado'],
              ['cancelled', 'Cancelado'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPaymentStatus(val)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  paymentStatus === val
                    ? val === 'pending'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400'
                      : val === 'paid'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700 text-red-800 dark:text-red-400'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {paymentType === 'monthly' ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Período
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
              Cubre desde hoy hasta 30 días después. La fecha de pago se registra sola cuando el
              pago quede marcado como "Pagado" (ahora, o luego desde Ingresos).
            </p>
          </div>
        ) : paymentStatus === 'paid' ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Fecha de pago
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Fecha de pago
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
              Se registra sola cuando el pago quede marcado como "Pagado" (ahora, o luego desde
              Ingresos).
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Notas <span className="normal-case text-slate-400 dark:text-slate-500">(opcional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Observaciones del pago…"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
      </>
    )}
  </div>
  );
};

export default StepPayment;
