import { Fragment, useEffect, useMemo, useState } from 'react';
import { sileo } from 'sileo';
import {
  Pencil,
  Check,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarHeart,
  MapPin,
  Users,
  Wallet,
  UtensilsCrossed,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import AuthRoles from '../components/auth/AuthRoles';
import ConfirmDialog from '../components/ConfirmDialog';
import Tooltip from '../components/Tooltip';

// Bandeja interna de cotizaciones de evento capturadas desde /contacto
// (sección "Cotiza tu evento"). Modelada sobre Prospects.jsx (mismo patrón
// de tabla con estado editable inline + fila expandible con el detalle).

const MEAL_TIME_LABEL = {
  Desayuno: 'Desayuno',
  Almuerzo: 'Almuerzo',
  Café: 'Café',
  Cena: 'Cena',
  'Snacks/Meriendas': 'Snacks/Meriendas',
  Brunch: 'Brunch',
};

const STATUS_LABEL = { new: 'Nuevo', contacted: 'Atendido', discarded: 'Descartado', converted: 'Convertido' };
const STATUS_COLOR = {
  new: 'bg-amber-100 text-amber-700',
  contacted: 'bg-blue-100 text-blue-700',
  discarded: 'bg-slate-200 text-slate-500',
  converted: 'bg-emerald-100 text-emerald-700',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatBudget = (quote) => {
  if (quote.has_budget === false) return 'Sin presupuesto';
  if (quote.has_budget === true) {
    return quote.budget_amount != null ? `₡${Number(quote.budget_amount).toLocaleString('es-CR')}` : 'Con presupuesto';
  }
  return '—';
};

const formatEventType = (quote) => {
  if (quote.event_type === 'Otro' && quote.event_type_other) return quote.event_type_other;
  return quote.event_type || '—';
};

const EventQuotes = () => {
  const { supabase } = useApp();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingStatus, setEditingStatus] = useState(null); // { id, status }
  const [expandedId, setExpandedId] = useState(null);
  const [discardingQuote, setDiscardingQuote] = useState(null);

  const fetchQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('event_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setQuotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchQuotes(), 0);
    return () => clearTimeout(timer);
  }, [supabase]);

  const displayList = useMemo(() => {
    const term = search.toLowerCase();
    return quotes
      .filter((q) => statusFilter === 'all' || q.status === statusFilter)
      .filter(
        (q) => (q.name ?? '').toLowerCase().includes(term) || (q.phone ?? '').toLowerCase().includes(term)
      );
  }, [quotes, statusFilter, search]);

  const handleStatusSave = async (id, newStatus) => {
    const { error } = await supabase
      .schema('operations')
      .from('event_quotes')
      .update({ status: newStatus })
      .eq('id_event_quote', id);

    if (error) {
      sileo.error('No se pudo actualizar el estado');
      return;
    }
    sileo.success(`Marcado como ${STATUS_LABEL[newStatus] ?? newStatus}`);
    setEditingStatus(null);
    await fetchQuotes();
  };

  const handleDiscard = async () => {
    if (!discardingQuote) return;
    const { error } = await supabase
      .schema('operations')
      .from('event_quotes')
      .update({ status: 'discarded' })
      .eq('id_event_quote', discardingQuote.id_event_quote);

    if (error) {
      sileo.error('No se pudo descartar la cotización');
      return;
    }
    sileo.success('Cotización descartada');
    setDiscardingQuote(null);
    await fetchQuotes();
  };

  return (
    <AuthRoles rolesNames={['Administrador', 'Clientes']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
        <ConfirmDialog
          open={!!discardingQuote}
          title="¿Descartar esta cotización?"
          message={discardingQuote ? `${discardingQuote.name} queda marcada como descartada.` : ''}
          confirmLabel="Descartar"
          confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          onConfirm={handleDiscard}
          onCancel={() => setDiscardingQuote(null)}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Cotizaciones</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Solicitudes de cotización de eventos capturadas desde el sitio público.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {[
              ['all', 'Todos'],
              ['new', 'Nuevo'],
              ['contacted', 'Atendido'],
              ['discarded', 'Descartado'],
              ['converted', 'Convertido'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-4 py-2 text-xs font-medium transition ${
                  statusFilter === val
                    ? 'bg-slate-900 dark:bg-slate-700 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Buscar nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600 transition min-w-[220px]"
          />
        </div>

        {loading ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
        ) : displayList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-12 text-center text-slate-400 dark:text-slate-600">
            No hay cotizaciones que coincidan con los filtros.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 dark:bg-slate-950 text-white text-xs uppercase tracking-wide">
                    <th className="px-5 py-4 text-left font-semibold">Nombre</th>
                    <th className="px-5 py-4 text-left font-semibold">Contacto</th>
                    <th className="px-5 py-4 text-left font-semibold">Evento</th>
                    <th className="px-5 py-4 text-left font-semibold">Fecha del evento</th>
                    <th className="px-5 py-4 text-center font-semibold min-w-[170px]">Estado</th>
                    <th className="px-5 py-4 text-center font-semibold w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((quote, i) => {
                    const isEditing = editingStatus?.id === quote.id_event_quote;
                    const isExpanded = expandedId === quote.id_event_quote;

                    return (
                      <Fragment key={quote.id_event_quote}>
                        <tr
                          className={`border-t border-slate-100 dark:border-slate-800 transition ${
                            i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950/40'
                          } hover:bg-slate-100 dark:hover:bg-slate-800/60`}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-800 dark:text-slate-100">{quote.name}</p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{quote.phone || '—'}</td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{formatEventType(quote)}</td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDateTime(quote.event_datetime)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="w-[170px] mx-auto">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <select
                                    value={editingStatus.status}
                                    onChange={(e) =>
                                      setEditingStatus({ id: quote.id_event_quote, status: e.target.value })
                                    }
                                    className="flex-1 min-w-0 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 focus:outline-none"
                                  >
                                    <option value="new">Nuevo</option>
                                    <option value="contacted">Atendido</option>
                                    <option value="discarded">Descartado</option>
                                    <option value="converted">Convertido</option>
                                  </select>
                                  <Tooltip label="Guardar estado">
                                    <button
                                      onClick={() => handleStatusSave(quote.id_event_quote, editingStatus.status)}
                                      className="p-1 text-green-600 hover:text-green-700 transition shrink-0"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip label="Cancelar edición de estado">
                                    <button
                                      onClick={() => setEditingStatus(null)}
                                      className="p-1 text-red-400 hover:text-red-600 transition shrink-0"
                                    >
                                      <X size={14} />
                                    </button>
                                  </Tooltip>
                                </div>
                              ) : (
                                <span
                                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[quote.status] ?? 'bg-slate-100 text-slate-600'}`}
                                >
                                  {STATUS_LABEL[quote.status] ?? quote.status}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip label="Ver detalle">
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : quote.id_event_quote)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              </Tooltip>
                              {!isEditing && (
                                <Tooltip label="Editar estado">
                                  <button
                                    onClick={() =>
                                      setEditingStatus({ id: quote.id_event_quote, status: quote.status })
                                    }
                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </Tooltip>
                              )}
                              {quote.status !== 'discarded' && (
                                <Tooltip label="Descartar">
                                  <button
                                    onClick={() => setDiscardingQuote(quote)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50 dark:bg-slate-950/40">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-start gap-2">
                                  <MapPin size={15} className="shrink-0 mt-0.5 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Lugar</p>
                                    <p className="text-slate-700 dark:text-slate-300">{quote.event_place || '—'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin size={15} className="shrink-0 mt-0.5 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Dirección</p>
                                    <p className="text-slate-700 dark:text-slate-300">{quote.event_address || '—'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Users size={15} className="shrink-0 mt-0.5 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Cantidad de personas</p>
                                    <p className="text-slate-700 dark:text-slate-300">{quote.guest_count ?? '—'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CalendarHeart size={15} className="shrink-0 mt-0.5 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Tiempos de alimentación</p>
                                    <p className="text-slate-700 dark:text-slate-300">
                                      {(quote.meal_times ?? []).length
                                        ? quote.meal_times.map((t) => MEAL_TIME_LABEL[t] ?? t).join(', ')
                                        : '—'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Wallet size={15} className="shrink-0 mt-0.5 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Presupuesto</p>
                                    <p className="text-slate-700 dark:text-slate-300">{formatBudget(quote)}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <UtensilsCrossed size={15} className="shrink-0 mt-0.5 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Requiere vajilla</p>
                                    <p className="text-slate-700 dark:text-slate-300">
                                      {quote.needs_dishware == null ? '—' : quote.needs_dishware ? 'Sí' : 'No'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AuthRoles>
  );
};

export default EventQuotes;
