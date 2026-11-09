import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

import useNotifications from '../hooks/useNotifications';
import useNotificationActions from '../hooks/useNotificationActions';
import { NOTIFICATION_TYPES, DEFAULT_NOTIFICATION_TYPE } from '../lib/notificationTypes';

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
        className="relative p-2 rounded-full text-oasis-ink/70 dark:text-slate-300 hover:bg-oasis-olive-50 dark:hover:bg-slate-800 transition"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-oasis-terracotta-dark text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-h-[70vh] overflow-y-auto bg-oasis-paper dark:bg-slate-800 text-oasis-ink dark:text-slate-100 rounded-xl shadow-xl py-2 border border-oasis-olive-100 dark:border-slate-700 z-50">
          <p className="px-4 py-1.5 text-xs font-semibold text-oasis-ink/40 dark:text-slate-500 uppercase tracking-wide">
            Notificaciones
          </p>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-oasis-ink/40 dark:text-slate-500 text-center">Sin notificaciones</p>
          ) : (
            notifications.slice(0, 8).map((n) => {
              const { Icon, color } = NOTIFICATION_TYPES[n.type] ?? DEFAULT_NOTIFICATION_TYPE;
              const isUnread = !readIds.has(n.id);
              return (
                <div
                  key={n.id}
                  className="w-full flex items-start gap-2 px-4 py-3 hover:bg-oasis-olive-50 dark:hover:bg-slate-700/50 border-b border-oasis-olive-50 dark:border-slate-700/50 last:border-b-0"
                >
                  <button
                    onClick={() => handleClick(n)}
                    disabled={loadingWeek}
                    className="flex items-start gap-2.5 flex-1 min-w-0 text-left disabled:opacity-50"
                  >
                    <Icon size={16} className={`shrink-0 mt-0.5 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-oasis-ink dark:text-slate-100 truncate">{n.title}</p>
                      <p className="text-xs text-oasis-ink/60 dark:text-slate-400 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-oasis-ink/40 dark:text-slate-500 mt-1">
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
                    className="shrink-0 mt-1 p-1 rounded-full hover:bg-oasis-olive-100 dark:hover:bg-slate-700 transition"
                  >
                    {isUnread ? (
                      <span className="block w-2 h-2 rounded-full bg-oasis-olive-600" />
                    ) : (
                      <span className="block w-2 h-2 rounded-full border border-oasis-olive-300 dark:border-slate-600" />
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
            className="w-full text-center px-4 py-2.5 text-xs font-semibold text-oasis-olive-700 dark:text-oasis-olive-400 hover:bg-oasis-olive-50 dark:hover:bg-slate-700/50 border-t border-oasis-olive-100 dark:border-slate-700 mt-1"
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
