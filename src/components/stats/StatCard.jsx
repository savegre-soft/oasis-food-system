const StatCard = ({ icon, label, value, sub, accent = 'text-slate-800', bg = 'bg-slate-100', iconColor }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg ${bg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default StatCard;
