import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check, X, Eye } from 'lucide-react';

// ── Domain constants ──────────────────────────────────────────────────────────

const TYPE_LABEL = { monthly: 'Mensual', weekly: 'Semanal', express: 'Express' };
const TYPE_COLOR  = {
  monthly: 'bg-violet-100 text-violet-700',
  weekly:  'bg-blue-100 text-blue-700',
  express: 'bg-amber-100 text-amber-700',
};
const STATUS_LABEL = { pending: 'Pendiente', cancelled: 'Cancelado' };
const STATUS_COLOR  = {
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
};
const ORDER_STATUS_LABEL = {
  PENDING: 'Pendiente', PACKED: 'Empacado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};
const ORDER_STATUS_COLOR = {
  PENDING:   'bg-amber-100 text-amber-700',
  PACKED:    'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};
const CLS_LABEL = {
  Lunch: 'Almuerzo', Dinner: 'Cena', Family: 'Familiar', both: 'Almuerzo + Cena',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const fmtShort = (str) =>
  str
    ? new Date(str + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
    : '—';

// ── Order mini row ────────────────────────────────────────────────────────────

const OrderMiniRow = ({ order, onView }) => (
  <div className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2 shadow-sm">
    <div className="flex items-center gap-2 min-w-0">
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${ORDER_STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
        {ORDER_STATUS_LABEL[order.status] ?? order.status}
      </span>
      <span className="text-xs font-medium text-slate-700 truncate">
        {CLS_LABEL[order.classification] ?? order.classification}
      </span>
      <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
        {fmtShort(order.week_start_date)} — {fmtShort(order.week_end_date)}
      </span>
    </div>
    <button
      onClick={onView}
      className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium shrink-0 transition"
    >
      <Eye size={12} /> Ver detalle
    </button>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const PaymentTable = ({
  payments,
  editingStatus,
  onStatusEdit,
  onStatusSave,
  onStatusCancel,
  onViewOrder,
  emptyMessage,
}) => {
  const [expandedPayment, setExpandedPayment] = useState(null);

  if (payments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm p-12 text-center text-slate-400"
      >
        {emptyMessage}
      </motion.div>
    );
  }

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
              <th className="px-5 py-4 text-left font-semibold">Cliente</th>
              <th className="px-5 py-4 text-left font-semibold">Tipo</th>
              <th className="px-5 py-4 text-left font-semibold">Fecha</th>
              <th className="px-5 py-4 text-right font-semibold">Monto</th>
              <th className="px-5 py-4 text-center font-semibold">Órdenes</th>
              <th className="px-5 py-4 text-center font-semibold">Estado</th>
              <th className="px-5 py-4 text-center font-semibold w-20"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => {
              const isEditing = editingStatus?.id === p.id_payment;
              const isMonthly = p.payment_type === 'monthly';
              const orders = (p.payment_orders ?? []).map((po) => po.orders).filter(Boolean);
              const isExpanded = expandedPayment === p.id_payment;

              return (
                <React.Fragment key={p.id_payment}>
                  <tr className={`border-t border-slate-100 transition ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{p.clients?.name ?? `Cliente ${p.client_id}`}</p>
                      {p.notes && <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLOR[p.payment_type] ?? 'bg-slate-100 text-slate-600'}`}>
                        {TYPE_LABEL[p.payment_type] ?? p.payment_type}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(p.payment_date)}</td>

                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {p.currency ?? 'CRC'} {Number(p.amount).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {isMonthly && orders.length > 0 ? (
                        <button
                          onClick={() => setExpandedPayment(isExpanded ? null : p.id_payment)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${isExpanded ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                        >
                          {orders.length}/4 ver
                        </button>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                          {orders.length}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <select
                            value={editingStatus.status}
                            onChange={(e) => onStatusEdit({ id: p.id_payment, status: e.target.value })}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                          <button onClick={() => onStatusSave(p.id_payment, editingStatus.status)} className="p-1 text-green-600 hover:text-green-700 transition">
                            <Check size={14} />
                          </button>
                          <button onClick={onStatusCancel} className="p-1 text-red-400 hover:text-red-600 transition">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!isMonthly && orders.length === 1 && !isEditing && (
                          <button
                            onClick={() => onViewOrder(orders[0])}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver orden"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={() => onStatusEdit({ id: p.id_payment, status: p.status })}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Editar estado"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isMonthly && isExpanded && (
                    <tr key={`${p.id_payment}-orders`} className="bg-violet-50">
                      <td colSpan={7} className="px-5 py-3">
                        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">
                          Órdenes asociadas ({orders.length}/4)
                        </p>
                        <div className="space-y-1.5">
                          {orders.map((order) => (
                            <OrderMiniRow key={order.id_order} order={order} onView={() => onViewOrder(order)} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan={3} className="px-5 py-3 text-xs text-slate-500 font-medium">
                {payments.length} registro{payments.length !== 1 ? 's' : ''}
              </td>
              <td className="px-5 py-3 text-right font-bold text-slate-800">₡{total.toLocaleString()}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
};

export default PaymentTable;
