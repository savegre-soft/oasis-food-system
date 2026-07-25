// ── Shared helpers for the "Ventas Masivas" module ──────────────────────────
// Venta de un solo plato cocinado en lote grande (ej. 50 porciones), con
// filas de venta opcionalmente asociadas a un cliente.

// batch: fila de bulk_sale_batches con bulk_sale_entries(*) anidado.
export const summarizeBatch = (batch) => {
  const entries = batch.bulk_sale_entries ?? [];
  const quantitySold = entries.reduce((sum, e) => sum + Number(e.quantity || 0), 0);
  const totalIncome = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const leftover = Number(batch.quantity_cooked || 0) - quantitySold;
  return { quantitySold, totalIncome, leftover };
};
