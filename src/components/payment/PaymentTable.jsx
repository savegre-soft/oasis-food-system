import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { Pencil, Check, X, Eye, Lock, Trash2 } from 'lucide-react';
import ConfirmDialog from '../ConfirmDialog';
import Tooltip from '../Tooltip';
import { PAYMENT_STATUS_LABEL, PAYMENT_TYPE_LABEL } from '../../utils/chartUtils';

// ── Domain constants ──────────────────────────────────────────────────────────

const TYPE_LABEL = PAYMENT_TYPE_LABEL;
const TYPE_COLOR  = {
  monthly: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  weekly:  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  express: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  combo:   'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  bulk:    'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  other:   'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
};
const STATUS_LABEL = PAYMENT_STATUS_LABEL;
const STATUS_COLOR  = {
  pending:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  paid:      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};
const ORDER_STATUS_LABEL = {
  PENDING: 'Pendiente', PACKED: 'Empacado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};
const ORDER_STATUS_COLOR = {
  PENDING:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  PACKED:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  DELIVERED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
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
  <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 shadow-sm">
    <div className="flex items-center gap-2 min-w-0">
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${ORDER_STATUS_COLOR[order.status] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
        {ORDER_STATUS_LABEL[order.status] ?? order.status}
      </span>
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
        {CLS_LABEL[order.classification] ?? order.classification}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
        {fmtShort(order.week_start_date)} — {fmtShort(order.week_end_date)}
      </span>
    </div>
    <button
      onClick={onView}
      className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium shrink-0 transition"
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
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onBulkStatusSave,
  onAmountSave,
  onClosePayment,
  onDeletePayment,
  emptyMessage,
}) => {
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [editingAmount, setEditingAmount] = useState(null); // { id, value }
  const [confirmAmountChange, setConfirmAmountChange] = useState(null); // { id, oldAmount, newAmount, clientName }

  if (payments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-12 text-center text-slate-400 dark:text-slate-500"
      >
        {emptyMessage}
      </motion.div>
    );
  }

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const allIds = payments.map((p) => p.id_payment);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  const bulkEnabled = !!onBulkStatusSave;

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden"
    >
      {bulkEnabled && selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800/50">
          <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
            {selectedIds.length} pago{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkStatusSave(selectedIds, 'pending')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
            >
              Marcar como Pendiente
            </button>
            <button
              onClick={() => onBulkStatusSave(selectedIds, 'paid')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
            >
              Marcar como Pagado
            </button>
            <button
              onClick={() => onBulkStatusSave(selectedIds, 'cancelled')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
            >
              Marcar como Cancelado
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 dark:bg-slate-900 text-white text-xs uppercase tracking-wide">
              {bulkEnabled && (
                <th className="px-4 py-4 text-center font-semibold w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onToggleSelectAll(allIds)}
                    className="w-4 h-4 rounded cursor-pointer accent-violet-600"
                  />
                </th>
              )}
              <th className="px-5 py-4 text-left font-semibold">Cliente</th>
              <th className="px-5 py-4 text-left font-semibold">Tipo</th>
              <th className="px-5 py-4 text-left font-semibold">Fecha</th>
              <th className="px-5 py-4 text-right font-semibold">Monto</th>
              <th className="px-5 py-4 text-center font-semibold">Órdenes</th>
              <th className="px-5 py-4 text-center font-semibold">Última orden agregada</th>
              <th className="px-5 py-4 text-center font-semibold min-w-[190px]">Estado</th>
              <th className="px-5 py-4 text-center font-semibold w-20"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => {
              const isEditing = editingStatus?.id === p.id_payment;
              const isMonthly = p.payment_type === 'monthly';
              const orders = (p.payment_orders ?? []).map((po) => po.orders).filter(Boolean);
              const lastOrderAddedAt = orders.reduce(
                (latest, o) => (o.created_at && (!latest || o.created_at > latest) ? o.created_at : latest),
                null
              );
              const isExpanded = expandedPayment === p.id_payment;
              const isSelected = selectedIds.includes(p.id_payment);

              return (
                <React.Fragment key={p.id_payment}>
                  <tr className={`border-t border-slate-100 dark:border-slate-700 transition ${i % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900/50'} ${isSelected ? 'bg-violet-50 dark:bg-violet-900/20' : ''} hover:bg-slate-100 dark:hover:bg-slate-700/50`}>
                    {bulkEnabled && (
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(p.id_payment)}
                          className="w-4 h-4 rounded cursor-pointer accent-violet-600"
                        />
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {p.clients?.name ?? (p.client_id ? `Cliente ${p.client_id}` : 'Ingreso manual')}
                      </p>
                      {p.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.notes}</p>}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLOR[p.payment_type] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {TYPE_LABEL[p.payment_type] ?? p.payment_type}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(p.payment_date)}
                      {isMonthly && (p.period_start_date || p.period_end_date) && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDate(p.period_start_date)} – {formatDate(p.period_end_date)}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {editingAmount?.id === p.id_payment ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            autoFocus
                            value={editingAmount.value}
                            onChange={(e) => setEditingAmount({ id: p.id_payment, value: e.target.value })}
                            className="w-28 text-right border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600"
                          />
                          <Tooltip label="Guardar monto">
                            <button
                              onClick={() => {
                                const newAmount = Number(editingAmount.value);
                                if (editingAmount.value === '' || Number.isNaN(newAmount) || newAmount < 0) return;
                                if (newAmount === Number(p.amount)) {
                                  setEditingAmount(null);
                                  return;
                                }
                                setConfirmAmountChange({
                                  id: p.id_payment,
                                  oldAmount: Number(p.amount),
                                  newAmount,
                                  clientName: p.clients?.name ?? (p.client_id ? `Cliente ${p.client_id}` : 'Ingreso manual'),
                                });
                              }}
                              className="p-1 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition"
                            >
                              <Check size={14} />
                            </button>
                          </Tooltip>
                          <Tooltip label="Cancelar edición de monto">
                            <button
                              onClick={() => setEditingAmount(null)}
                              className="p-1 text-red-400 dark:text-red-500/80 hover:text-red-600 dark:hover:text-red-400 transition"
                            >
                              <X size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <span>{p.currency ?? 'CRC'} {Number(p.amount).toLocaleString()}</span>
                          {onAmountSave && (
                            <Tooltip label="Editar monto">
                              <button
                                onClick={() => setEditingAmount({ id: p.id_payment, value: String(p.amount) })}
                                className="p-1 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition"
                              >
                                <Pencil size={12} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isMonthly && orders.length > 0 ? (
                          <button
                            onClick={() => setExpandedPayment(isExpanded ? null : p.id_payment)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${isExpanded ? 'bg-violet-600 text-white' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50'}`}
                          >
                            {orders.length}/4 ver
                          </button>
                        ) : (
                          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-medium">
                            {orders.length}
                          </span>
                        )}
                        {isMonthly && p.closed_at && (
                          <span
                            className="flex items-center gap-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full font-medium"
                            title={`Cerrado manualmente el ${formatDate(p.closed_at.split('T')[0])}`}
                          >
                            <Lock size={10} /> Cerrado
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {isMonthly && lastOrderAddedAt ? formatDate(lastOrderAddedAt.split('T')[0]) : '—'}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {/* Ancho fijo en ambos estados (editando o no) para que la columna nunca
                          se ensanche al entrar en edición — si el ancho cambia, la tabla se
                          reacomoda y las acciones de las demás filas quedan fuera del área
                          visible del contenedor con scroll horizontal. */}
                      <div className="w-[190px] mx-auto">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <select
                              value={editingStatus.status}
                              onChange={(e) => onStatusEdit({ id: p.id_payment, status: e.target.value })}
                              className="flex-1 min-w-0 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="paid">Pagado</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                            <Tooltip label="Guardar estado">
                              <button
                                onClick={() => onStatusSave(p.id_payment, editingStatus.status)}
                                className="p-1 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition shrink-0"
                              >
                                <Check size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Cancelar edición de estado">
                              <button
                                onClick={onStatusCancel}
                                className="p-1 text-red-400 dark:text-red-500/80 hover:text-red-600 dark:hover:text-red-400 transition shrink-0"
                              >
                                <X size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[p.status] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!isMonthly && orders.length === 1 && !isEditing && (
                          <Tooltip label="Ver orden">
                            <button
                              onClick={() => onViewOrder(orders[0])}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                            >
                              <Eye size={14} />
                            </button>
                          </Tooltip>
                        )}
                        {!isEditing && (
                          <Tooltip label="Editar estado">
                            <button
                              onClick={() => onStatusEdit({ id: p.id_payment, status: p.status })}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                              <Pencil size={14} />
                            </button>
                          </Tooltip>
                        )}
                        {onClosePayment && isMonthly && !p.closed_at && orders.length < 4 && (
                          <Tooltip label="Cerrar pago (no completó las 4 órdenes)">
                            <button
                              onClick={() => onClosePayment(p)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition"
                            >
                              <Lock size={14} />
                            </button>
                          </Tooltip>
                        )}
                        {onDeletePayment && !isEditing && (
                          <Tooltip label="Eliminar pago">
                            <button
                              onClick={() => onDeletePayment(p)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isMonthly && isExpanded && (
                    <tr key={`${p.id_payment}-orders`} className="bg-violet-50 dark:bg-violet-900/20">
                      <td colSpan={bulkEnabled ? 9 : 8} className="px-5 py-3">
                        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-2">
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
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-200 dark:border-slate-700">
              {bulkEnabled && <td />}
              <td colSpan={3} className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {payments.length} registro{payments.length !== 1 ? 's' : ''}
              </td>
              <td className="px-5 py-3 text-right font-bold text-slate-800 dark:text-slate-100">₡{total.toLocaleString()}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>

    <ConfirmDialog
      open={!!confirmAmountChange}
      title="¿Cambiar el monto de este pago?"
      message={
        confirmAmountChange
          ? `${confirmAmountChange.clientName}: ₡${confirmAmountChange.oldAmount.toLocaleString()} → ₡${confirmAmountChange.newAmount.toLocaleString()}. Esta acción se aplica de inmediato.`
          : ''
      }
      confirmLabel="Confirmar cambio"
      confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition"
      onCancel={() => setConfirmAmountChange(null)}
      onConfirm={async () => {
        await onAmountSave(confirmAmountChange.id, confirmAmountChange.newAmount);
        setConfirmAmountChange(null);
        setEditingAmount(null);
      }}
    />
    </>
  );
};

export default PaymentTable;
