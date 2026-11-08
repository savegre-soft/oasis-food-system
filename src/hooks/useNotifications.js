import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const POLL_MS = 45000;

export default function useNotifications() {
  const { supabase, user } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    const [{ data: notifs, error: nErr }, { data: reads, error: rErr }] = await Promise.all([
      supabase
        .schema('operations')
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.schema('operations').from('notification_reads').select('notification_id').eq('user_id', user.id),
    ]);
    if (nErr) console.error(nErr);
    if (rErr) console.error(rErr);
    setNotifications(notifs ?? []);
    setReadIds(new Set((reads ?? []).map((r) => r.notification_id)));
    setLoading(false);
  }, [supabase, user]);

  // setTimeout desacopla la llamada del cuerpo síncrono del efecto — fetchAll
  // sincroniza con Supabase (fuente externa), mismo patrón que Deliveries.jsx.
  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 0);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(interval);
  }, [user, fetchAll]);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!user?.id || readIds.has(notificationId)) return;
      setReadIds((prev) => new Set(prev).add(notificationId));
      const { error } = await supabase
        .schema('operations')
        .from('notification_reads')
        .upsert({ notification_id: notificationId, user_id: user.id }, { onConflict: 'notification_id,user_id' });
      if (error) console.error(error);
    },
    [supabase, user, readIds]
  );

  const markAsUnread = useCallback(
    async (notificationId) => {
      if (!user?.id || !readIds.has(notificationId)) return;
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
      const { error } = await supabase
        .schema('operations')
        .from('notification_reads')
        .delete()
        .eq('notification_id', notificationId)
        .eq('user_id', user.id);
      if (error) console.error(error);
    },
    [supabase, user, readIds]
  );

  const unread = notifications.filter((n) => !readIds.has(n.id));

  return {
    notifications,
    unreadCount: unread.length,
    readIds,
    loading,
    markAsRead,
    markAsUnread,
    refresh: fetchAll,
  };
}
