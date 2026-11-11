// Un combo o una venta publicados en /promociones no son "una promoción" —
// cada uno tiene su propio flag `is_published` en su propia tabla (ver
// supabase/migrations/20261112_decouple_combo_bulk_from_promotions.sql).
// Helper compartido por ComboOrdersTab.jsx (combo_weeks) y BulkSales.jsx
// (bulk_dishes) para alternar ese flag con el mismo patrón en ambos.
export const togglePublished = async (supabase, { table, idColumn, idValue, current }) => {
  const { error } = await supabase
    .schema('operations')
    .from(table)
    .update({ is_published: !current })
    .eq(idColumn, idValue);
  if (error) throw error;
  return !current;
};
