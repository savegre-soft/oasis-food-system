import { useState } from 'react';
import { Bell, CalendarHeart, Check, RotateCcw } from 'lucide-react';

import useNotifications from '../hooks/useNotifications';
import useNotificationActions from '../hooks/useNotificationActions';

const TYPE_CONFIG = {
  quote_request: {
    Icon: CalendarHeart,
    color: 'text-oasis-olive-600 dark:text-oasis-olive-400',
    bg: 'bg-oasis-olive-50 dark:bg-oasis-olive-900/20',
  },
};

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
];

const Notifications = () => {
  const { notifications, unreadCount, readIds, loading, markAsRead, markAsUnread } = useNotifications();
  const { handleSelect } = useNotificationActions(markAsRead);
  const [tab, setTab] = useState('all');

  const displayed = tab === 'unread' ? notifications.filter((n) => !readIds.has(n.id)) : notifications;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-oasis-olive-50 dark:bg-slate-800 rounded-xl">
            <Bell size={20} className="text-oasis-olive-700 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notificaciones</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Cotizaciones de eventos recibidas desde el sitio público
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {unreadCount} sin leer
          </span>
        )}
      </div>

      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden w-fit mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 text-sm font-medium transition ${
              tab === id
                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-12 text-center">Cargando...</p>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-600">
            <Bell size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{tab === 'unread' ? 'No hay notificaciones sin leer' : 'Sin notificaciones'}</p>
          </div>
        ) : (
          displayed.map((n) => {
            const { Icon, color, bg } = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.quote_request;
            const isUnread = !readIds.has(n.id);
            return (
              <div
                key={n.id}
                className="w-full flex items-start gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-50 dark:border-slate-800 last:border-b-0 transition"
              >
                <button
                  onClick={() => handleSelect(n)}
                  className="flex items-start gap-3 flex-1 min-w-0 text-left"
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
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-1.5">
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
                  className="shrink-0 mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
    </div>
  );
};

export default Notifications;
