import { useNavigate } from 'react-router-dom';
import { Bell, Clock, CalendarClock, CalendarCheck } from 'lucide-react';

import useNotifications from '../hooks/useNotifications';
import useNotificationActions from '../hooks/useNotificationActions';

const TYPE_CONFIG = {
  payment_pending: { Icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
  period_open: { Icon: CalendarClock, color: 'text-blue-600 dark:text-blue-400' },
  period_close: { Icon: CalendarCheck, color: 'text-emerald-600 dark:text-emerald-400' },
};

const NotificationBell = ({ openMenu, toggleMenu, menuKey = 'notifications' }) => {
  const nav = useNavigate();
  const { notifications, unreadCount, readIds, markAsRead, markAsUnread } = useNotifications();
  const { handleSelect, loadingWeek, reportPortal } = useNotificationActions(markAsRead);

  const open = openMenu === menuKey;

  const handleClick = async (n) => {
    toggleMenu(menuKey);
    await handleSelect(n);
  };

  return (
    <div className="relative">
      <button
        onClick={() => toggleMenu(menuKey)}
        title="Notificaciones"
        className="relative p-2 rounded-full hover:bg-green-700 transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-800 text-green-800 dark:text-green-300 rounded-xl shadow-xl py-2 border border-gray-100 dark:border-gray-700">
          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Notificaciones
          </p>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">Sin notificaciones</p>
          ) : (
            notifications.slice(0, 8).map((n) => {
              const { Icon, color } = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.payment_pending;
              const isUnread = !readIds.has(n.id);
              return (
                <div
                  key={n.id}
                  className="w-full flex items-start gap-2 px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/30 border-b border-gray-50 dark:border-gray-700/50 last:border-b-0"
                >
                  <button
                    onClick={() => handleClick(n)}
                    disabled={loadingWeek}
                    className="flex items-start gap-2.5 flex-1 min-w-0 text-left disabled:opacity-50"
                  >
                    <Icon size={16} className={`shrink-0 mt-0.5 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString('es-CR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => (isUnread ? markAsRead(n.id) : markAsUnread(n.id))}
                    title={isUnread ? 'Marcar como leída' : 'Marcar como no leída'}
                    className="shrink-0 mt-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    {isUnread ? (
                      <span className="block w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="block w-2 h-2 rounded-full border border-gray-300 dark:border-gray-600" />
                    )}
                  </button>
                </div>
              );
            })
          )}

          <button
            onClick={() => {
              toggleMenu(menuKey);
              nav('/notificaciones');
            }}
            className="w-full text-center px-4 py-2.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 border-t border-gray-100 dark:border-gray-700 mt-1"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}

      {reportPortal}
    </div>
  );
};

export default NotificationBell;
