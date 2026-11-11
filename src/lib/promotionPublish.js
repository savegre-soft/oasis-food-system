// Helpers compartidos del patrón "Publicar en Promociones" usado desde
// ComboOrdersTab.jsx (por combo_week_id) y BulkSales.jsx (por bulk_dish_id) —
// evita que ambas copias diverjan en qué columnas se insertan/actualizan.

export const fetchPromotionBy = async (supabase, { sourceType, column, value }) => {
  if (!value) return null;
  const { data, error } = await supabase
    .schema('operations')
    .from('promotions')
    .select('id_promotion, is_active')
    .eq('source_type', sourceType)
    .eq(column, value)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Si no existe promoción la crea activa; si existe, solo alterna is_active —
// nunca se borra, para no perder título/descripción/imagen ya personalizados
// desde PromotionsAdmin.jsx.
export const togglePromotionPublish = async (supabase, { promotion, insertPayload }) => {
  if (!promotion) {
    const { data, error } = await supabase
      .schema('operations')
      .from('promotions')
      .insert([{ ...insertPayload, is_active: true }])
      .select('id_promotion, is_active')
      .single();
    if (error) throw error;
    return data;
  }

  const { error } = await supabase
    .schema('operations')
    .from('promotions')
    .update({ is_active: !promotion.is_active })
    .eq('id_promotion', promotion.id_promotion);
  if (error) throw error;
  return { ...promotion, is_active: !promotion.is_active };
};
