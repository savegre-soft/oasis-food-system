import Users from '../Module/Users';

const Settings = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">Configuración</h1>
        <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
          Administra usuarios y preferencias del sistema
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200 mb-4">Usuarios</h2>
        <Users />
      </div>
    </div>
  );
};

export default Settings;