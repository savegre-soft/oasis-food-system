import { NOTIFICATION_TYPES } from '../../lib/notificationTypes';
import useNotificationPrefs from '../../hooks/useNotificationPrefs';

export default function NotificationSettings() {
  const { isMuted, toggleType } = useNotificationPrefs();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Centro de notificaciones</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Elige qué tipos de notificación quieres ver en la campana. Esta preferencia se guarda solo en este
            navegador.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-gray-700">
          {Object.entries(NOTIFICATION_TYPES).map(
            // eslint-disable-next-line no-unused-vars -- Icon renders as <Icon/> below; no-unused-vars doesn't see JSX tag usage of a destructured var
            ([type, { label, description, Icon, color }]) => {
              const muted = isMuted(type);
              return (
                <div key={type} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon size={18} className={`shrink-0 mt-0.5 ${color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={!muted}
                    onClick={() => toggleType(type)}
                    title={muted ? 'Activar notificación' : 'Silenciar notificación'}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                      muted ? 'bg-slate-200 dark:bg-slate-700' : 'bg-oasis-olive-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        muted ? 'translate-x-0' : 'translate-x-5'
                      }`}
                    />
                  </button>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
