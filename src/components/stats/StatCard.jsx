const StatCard = ({ icon, label, value, sub, accent = 'text-slate-800 dark:text-slate-100', bg = 'bg-slate-100 dark:bg-slate-700', iconColor }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg ${bg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
    </div>
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
  </div>
);

export default StatCard;
