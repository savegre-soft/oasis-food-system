import { useState } from 'react';
import { Bell, Clock, CalendarClock, CalendarCheck, Check, RotateCcw } from 'lucide-react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';

import useNotifications from '../hooks/useNotifications';
import useNotificationActions from '../hooks/useNotificationActions';

const TYPE_CONFIG = {
  payment_pending: { Icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  period_open: { Icon: CalendarClock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  period_close: { Icon: CalendarCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
};

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
];

const Notifications = () => {
  const { notifications, unreadCount, readIds, loading, markAsRead, markAsUnread } = useNotifications();
  const { handleSelect, loadingWeek, reportPortal } = useNotificationActions(markAsRead);
  const [tab, setTab] = useState('all');

  const displayed = tab === 'unread' ? notifications.filter((n) => !readIds.has(n.id)) : notifications;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <Bell size={20} className="text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Notificaciones</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Pagos pendientes, apertura/cierre de la semana de pedidos y resúmenes de producción
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {unreadCount} sin leer
          </span>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden w-fit mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 text-sm font-medium transition ${
              tab === id ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-12 text-center">Cargando...</p>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Bell size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{tab === 'unread' ? 'No hay notificaciones sin leer' : 'Sin notificaciones'}</p>
          </div>
        ) : (
          displayed.map((n) => {
            const { Icon, color, bg } = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.payment_pending;
            const isUnread = !readIds.has(n.id);
            return (
              <div
                key={n.id}
                className="w-full flex items-start gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700 last:border-b-0 transition"
              >
                <button
                  onClick={() => handleSelect(n)}
                  disabled={loadingWeek}
                  className="flex items-start gap-3 flex-1 min-w-0 text-left disabled:opacity-50"
                >
                  <div className={`shrink-0 p-2 rounded-xl ${bg}`}>
                    <Icon size={16} className={color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
                      {isUnread && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          Nueva
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                      {new Date(n.created_at).toLocaleString('es-CR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => (isUnread ? markAsRead(n.id) : markAsUnread(n.id))}
                  title={isUnread ? 'Marcar como leída' : 'Marcar como no leída'}
                  className="shrink-0 mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  {isUnread ? (
                    <>
                      <Check size={13} /> Marcar leída
                    </>
                  ) : (
                    <>
                      <RotateCcw size={13} /> Marcar no leída
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {reportPortal}
    </div>
  );
};

export default Notifications;
