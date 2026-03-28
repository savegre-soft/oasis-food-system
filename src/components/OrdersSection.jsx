import HistoryView from "./HistoryView";
import usesta

// Orders section with tabs
const OrdersSection = ({ clientId }) => {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('current');

  const { weekStart, weekEnd } = getNextWeekRange();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .schema('operations')
        .from('orders')
        .select(`
          id_order,
          week_start_date,
          week_end_date,
          classification,
          status,
          protein_snapshot,
          protein_unit_snapshot,
          carb_snapshot,
          carb_unit_snapshot,
          routes ( id_route, name ),
          order_days (
            id_order_day,
            day_of_week,
            delivery_date,
            status,
            order_day_details (
              id_order_day_detail,
              recipe_id,
              quantity,
              recipes ( id_recipe, name )
            )
          )
        `)
        .eq('client_id', clientId)
        .order('week_start_date', { ascending: false })
        .order('id_order',        { ascending: false });

      if (error) { console.error(error); }
      else setOrders(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [clientId]);

  const currentOrders = orders.filter(
    (o) => o.week_start_date === weekStart && o.week_end_date === weekEnd
  );
  const historyOrders = orders.filter(
    (o) => !(o.week_start_date === weekStart && o.week_end_date === weekEnd)
  );

  const tabs = [
    { id: 'current', label: 'Semana actual', count: currentOrders.length },
    { id: 'history', label: 'Histórico',     count: historyOrders.length },
  ];

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Órdenes</p>

      {/* Tab bar */}
      <div className="flex gap-2">
        {tabs.map(({ id, label, count }) => {
          const isActive = activeTab === id;
          const cls = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border '
            + (isActive ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400');
          const badgeCls = 'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center '
            + (isActive ? 'bg-white text-slate-800' : 'bg-slate-100 text-slate-600');
          return (
            <button key={id} type="button" onClick={() => setActiveTab(id)} className={cls}>
              {label}
              {count > 0 && <span className={badgeCls}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-slate-400 py-4">Cargando órdenes...</p>
      ) : activeTab === 'current' ? (
        <CurrentWeekView orders={currentOrders} />
      ) : (
        <HistoryView orders={historyOrders} />
      )}
    </div>
  );
};