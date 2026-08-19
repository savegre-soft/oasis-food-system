const ChartCard = ({ title, sub, loading, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {loading ? (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-slate-500 dark:border-t-slate-400 rounded-full animate-spin" />
      </div>
    ) : (
      children
    )}
  </div>
);

export default ChartCard;
