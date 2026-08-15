import { useEffect, useState, useMemo } from 'react';
import { Copy, Check, Search, ClipboardCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sileo } from 'sileo';

// Checklist semanal de a quién enviarle el link del portal de pedidos
// (clients.portal_token). No todos los clientes activos piden todas las
// semanas — el staff sí sabe quién — así que esto persiste esa decisión por
// semana en operations.order_week_checklist, en vez de tener que recordarlo
// cada vez. Si la semana todavía no tiene filas guardadas, se usa como
// default lo que se dejó marcado la semana anterior (la mayoría de semanas
// el roster casi no cambia); recién se escribe en la base cuando el staff
// togglea o marca "enviado" algo — no se siembra la tabla de una vez.
const OrderChecklistTab = ({ weekStart, weekLabel }) => {
  const { supabase } = useApp();

  const [clients, setClients] = useState([]);
  const [thisWeekRows, setThisWeekRows] = useState({});
  const [prevWeekRows, setPrevWeekRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const prevWeekStart = (() => {
      const d = new Date(weekStart + 'T00:00:00');
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    })();

    const run = async () => {
      setLoading(true);
      const [{ data: clientsData, error: clientsError }, { data: thisWeek }, { data: prevWeek }] =
        await Promise.all([
          supabase
            .schema('operations')
            .from('clients')
            .select('id_client, name, portal_token')
            .eq('is_active', true)
            .order('name'),
          supabase
            .schema('operations')
            .from('order_week_checklist')
            .select('client_id, should_send, link_sent_at')
            .eq('week_start_date', weekStart),
          supabase
            .schema('operations')
            .from('order_week_checklist')
            .select('client_id, should_send')
            .eq('week_start_date', prevWeekStart),
        ]);
      if (clientsError) console.error(clientsError);
      setClients(clientsData ?? []);
      setThisWeekRows(Object.fromEntries((thisWeek ?? []).map((r) => [r.client_id, r])));
      setPrevWeekRows(Object.fromEntries((prevWeek ?? []).map((r) => [r.client_id, r])));
      setLoading(false);
    };
    setTimeout(run, 0);
  }, [supabase, weekStart]);

  // Filas "virtuales": si la semana actual no tiene fila guardada para un
  // cliente, se usa el valor de la semana pasada (o true por defecto) sin
  // escribirlo todavía — solo se persiste cuando el staff interactúa.
  const rows = useMemo(
    () =>
      clients.map((c) => {
        const saved = thisWeekRows[c.id_client];
        const prev = prevWeekRows[c.id_client];
        return {
          client: c,
          shouldSend: saved?.should_send ?? prev?.should_send ?? true,
          linkSentAt: saved?.link_sent_at ?? null,
        };
      }),
    [clients, thisWeekRows, prevWeekRows]
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.client.name.toLowerCase().includes(q));
  }, [rows, search]);

  const upsertRow = async (clientId, patch) => {
    const { data, error } = await supabase
      .schema('operations')
      .from('order_week_checklist')
      .upsert(
        {
          week_start_date: weekStart,
          client_id: clientId,
          should_send: thisWeekRows[clientId]?.should_send ?? prevWeekRows[clientId]?.should_send ?? true,
          link_sent_at: thisWeekRows[clientId]?.link_sent_at ?? null,
          ...patch,
        },
        { onConflict: 'week_start_date,client_id' }
      )
      .select('client_id, should_send, link_sent_at')
      .single();
    if (error) {
      sileo.error('No se pudo guardar el cambio');
      console.error(error);
      return;
    }
    setThisWeekRows((prev) => ({ ...prev, [clientId]: data }));
  };

  const toggleShouldSend = (row) => upsertRow(row.client.id_client, { should_send: !row.shouldSend });

  const markSent = (row) => upsertRow(row.client.id_client, { link_sent_at: new Date().toISOString() });

  const copyLink = (client) => {
    const url = `${window.location.origin}/portal/${client.portal_token}`;
    navigator.clipboard.writeText(url);
    sileo.success('Enlace copiado');
  };

  const pendingCount = rows.filter((r) => r.shouldSend && !r.linkSentAt).length;

  if (loading) return <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{weekLabel}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {pendingCount > 0
              ? `${pendingCount} cliente${pendingCount === 1 ? '' : 's'} por enviar el link esta semana`
              : 'Todos los que corresponden esta semana ya tienen el link enviado'}
          </p>
        </div>
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-600">
          <ClipboardCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? 'Sin resultados' : 'No hay clientes activos'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRows.map((row) => (
            <div
              key={row.client.id_client}
              className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleShouldSend(row)}
                title={row.shouldSend ? 'Pide esta semana' : 'No pide esta semana'}
                className={`shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition ${
                  row.shouldSend ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                    row.shouldSend ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>

              <p
                className={`flex-1 min-w-0 truncate text-sm font-medium ${
                  row.shouldSend
                    ? 'text-slate-800 dark:text-slate-100'
                    : 'text-slate-400 dark:text-slate-600 line-through'
                }`}
              >
                {row.client.name}
              </p>

              {row.shouldSend && (
                <>
                  {row.linkSentAt ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                      <Check size={12} /> Enviado
                    </span>
                  ) : (
                    <button
                      onClick={() => markSent(row)}
                      className="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 transition"
                    >
                      Marcar enviado
                    </button>
                  )}
                  <button
                    onClick={() => copyLink(row.client)}
                    disabled={!row.client.portal_token}
                    title={row.client.portal_token ? 'Copiar enlace del portal' : 'Cliente sin enlace de portal'}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl hover:border-slate-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Copy size={12} /> Copiar enlace
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderChecklistTab;
