import { sileo } from 'sileo';

// Transiciones de estado de order_day_details, compartidas entre la página
// de Producción semanal y la de Express (mismo modelo order_days/order_day_details).
export const useOrderDayActions = (supabase, refresh) => {
  const updateAllDetailsStatus = async (orderDayIdOrIds, newStatus, successMsg) => {
    const ids = Array.isArray(orderDayIdOrIds) ? orderDayIdOrIds : [orderDayIdOrIds];
    if (ids.length === 0) return;

    const query = supabase.schema('operations').from('order_day_details').update({ status: newStatus });
    const { error } = ids.length === 1
      ? await query.eq('order_day_id', ids[0])
      : await query.in('order_day_id', ids);

    if (error) {
      sileo.error('Error al actualizar el estado');
      console.error(error);
      return;
    }
    sileo.success(successMsg);
    await refresh();
  };

  const updateDetailStatus = async (idOrIds, newStatus, msgOne, msgMany) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    if (ids.length === 0) return;

    const query = supabase.schema('operations').from('order_day_details').update({ status: newStatus });
    const { error } = ids.length === 1
      ? await query.eq('id_order_day_detail', ids[0])
      : await query.in('id_order_day_detail', ids);

    if (error) {
      sileo.error('Error al actualizar el estado');
      console.error(error);
      return;
    }
    sileo.success(ids.length === 1 ? msgOne : (msgMany ?? msgOne));
    await refresh();
  };

  return {
    markPacked: (id) => updateAllDetailsStatus(id, 'PACKED', '📦 Marcado como empacado'),
    markDelivered: (id) => updateAllDetailsStatus(id, 'DELIVERED', '🚚 Entrega registrada'),
    markPending: (id) => updateAllDetailsStatus(id, 'PENDING', 'Devuelto a pendiente'),
    markPackedDetail: (idOrIds) => updateDetailStatus(idOrIds, 'PACKED', '📦 Plato empacado', '📦 Platos empacados'),
    markDeliveredDetail: (idOrIds) => updateDetailStatus(idOrIds, 'DELIVERED', '🚚 Plato entregado', '🚚 Platos entregados'),
    markPendingDetail: (idOrIds) => updateDetailStatus(idOrIds, 'PENDING', 'Plato devuelto a cocina', 'Platos devueltos a cocina'),
  };
};
