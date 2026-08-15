import { Fragment, useEffect, useMemo, useState } from 'react';
import { sileo } from 'sileo';
import { Pencil, Check, X, UserPlus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AuthRoles from '../components/auth/AuthRoles';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import AddCustomer from '../components/AddCustomer';
import Tooltip from '../components/Tooltip';

// Bandeja interna de interesados/contactos del sitio público (RF-PUB-05).
// Modelada sobre el patrón de Payments.jsx + PaymentTable.jsx (tabla con
// estado editable inline + acciones por fila), adaptada a un caso más chico.

const SOURCE_LABEL = { contacto: 'Contacto', interesado: 'Interesado' };
const SOURCE_COLOR = {
  contacto: 'bg-blue-100 text-blue-700',
  interesado: 'bg-violet-100 text-violet-700',
};
const STATUS_LABEL = { new: 'Nuevo', contacted: 'Atendido', discarded: 'Descartado', converted: 'Convertido' };
const STATUS_COLOR = {
  new: 'bg-amber-100 text-amber-700',
  contacted: 'bg-blue-100 text-blue-700',
  discarded: 'bg-slate-200 text-slate-500',
  converted: 'bg-emerald-100 text-emerald-700',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const Prospects = () => {
  const { supabase } = useApp();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingStatus, setEditingStatus] = useState(null); // { id, status }
  const [expandedId, setExpandedId] = useState(null);
  const [discardingLead, setDiscardingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setLeads(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchLeads(), 0);
    return () => clearTimeout(timer);
  }, [supabase]);

  const displayList = useMemo(() => {
    const term = search.toLowerCase();
    return leads
      .filter((l) => statusFilter === 'all' || l.status === statusFilter)
      .filter((l) => sourceFilter === 'all' || l.source === sourceFilter)
      .filter(
        (l) =>
          (l.name ?? '').toLowerCase().includes(term) || (l.phone ?? '').toLowerCase().includes(term)
      );
  }, [leads, statusFilter, sourceFilter, search]);

  const handleStatusSave = async (id, newStatus) => {
    const { error } = await supabase
      .schema('operations')
      .from('leads')
      .update({ status: newStatus })
      .eq('id_lead', id);

    if (error) {
      sileo.error('No se pudo actualizar el estado');
      return;
    }
    sileo.success(`Marcado como ${STATUS_LABEL[newStatus] ?? newStatus}`);
    setEditingStatus(null);
    await fetchLeads();
  };

  const handleDiscard = async () => {
    if (!discardingLead) return;
    const { error } = await supabase
      .schema('operations')
      .from('leads')
      .update({ status: 'discarded' })
      .eq('id_lead', discardingLead.id_lead);

    if (error) {
      sileo.error('No se pudo descartar el prospecto');
      return;
    }
    sileo.success('Prospecto descartado');
    setDiscardingLead(null);
    await fetchLeads();
  };

  const handleCustomerCreated = async () => {
    if (!convertingLead) return;
    await supabase
      .schema('operations')
      .from('leads')
      .update({ status: 'converted' })
      .eq('id_lead', convertingLead.id_lead);

    sileo.success('Cliente creado a partir del prospecto');
    setConvertingLead(null);
    await fetchLeads();
  };

  return (
    <AuthRoles rolesNames={['Administrador', 'Clientes']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
        <ConfirmDialog
          open={!!discardingLead}
          title="¿Descartar este prospecto?"
          message={discardingLead ? `${discardingLead.name} queda marcado como descartado.` : ''}
          confirmLabel="Descartar"
          confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          onConfirm={handleDiscard}
          onCancel={() => setDiscardingLead(null)}
        />

        <Modal isOpen={!!convertingLead} onClose={() => setConvertingLead(null)}>
          {convertingLead && (
            <AddCustomer
              initialData={{ name: convertingLead.name, phone: convertingLead.phone }}
              onAdd={handleCustomerCreated}
            />
          )}
        </Modal>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Prospectos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Contactos e interesados capturados desde el sitio público.
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

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600 transition"
          >
            <option value="all">Todas las fuentes</option>
            <option value="contacto">Contacto</option>
            <option value="interesado">Interesado</option>
          </select>

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
            No hay prospectos que coincidan con los filtros.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 dark:bg-slate-950 text-white text-xs uppercase tracking-wide">
                    <th className="px-5 py-4 text-left font-semibold">Nombre</th>
                    <th className="px-5 py-4 text-left font-semibold">Contacto</th>
                    <th className="px-5 py-4 text-center font-semibold">Fuente</th>
                    <th className="px-5 py-4 text-left font-semibold">Fecha</th>
                    <th className="px-5 py-4 text-center font-semibold min-w-[170px]">Estado</th>
                    <th className="px-5 py-4 text-center font-semibold w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((lead, i) => {
                    const isEditing = editingStatus?.id === lead.id_lead;
                    const isExpanded = expandedId === lead.id_lead;

                    return (
                      <Fragment key={lead.id_lead}>
                        <tr
                          className={`border-t border-slate-100 dark:border-slate-800 transition ${
                            i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950/40'
                          } hover:bg-slate-100 dark:hover:bg-slate-800/60`}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-800 dark:text-slate-100">{lead.name}</p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                            {lead.phone || lead.email || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SOURCE_COLOR[lead.source] ?? 'bg-slate-100 text-slate-600'}`}>
                              {SOURCE_LABEL[lead.source] ?? lead.source}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="w-[170px] mx-auto">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <select
                                    value={editingStatus.status}
                                    onChange={(e) => setEditingStatus({ id: lead.id_lead, status: e.target.value })}
                                    className="flex-1 min-w-0 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 focus:outline-none"
                                  >
                                    <option value="new">Nuevo</option>
                                    <option value="contacted">Atendido</option>
                                    <option value="discarded">Descartado</option>
                                    <option value="converted">Convertido</option>
                                  </select>
                                  <Tooltip label="Guardar estado">
                                    <button
                                      onClick={() => handleStatusSave(lead.id_lead, editingStatus.status)}
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
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                  {STATUS_LABEL[lead.status] ?? lead.status}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              {lead.message && (
                                <Tooltip label="Ver mensaje">
                                  <button
                                    onClick={() => setExpandedId(isExpanded ? null : lead.id_lead)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                  >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                </Tooltip>
                              )}
                              {!isEditing && (
                                <Tooltip label="Editar estado">
                                  <button
                                    onClick={() => setEditingStatus({ id: lead.id_lead, status: lead.status })}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </Tooltip>
                              )}
                              {lead.status !== 'converted' && (
                                <Tooltip label="Crear cliente">
                                  <button
                                    onClick={() => setConvertingLead(lead)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                                  >
                                    <UserPlus size={14} />
                                  </button>
                                </Tooltip>
                              )}
                              {lead.status !== 'discarded' && (
                                <Tooltip label="Descartar">
                                  <button
                                    onClick={() => setDiscardingLead(lead)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && lead.message && (
                          <tr className="bg-slate-50 dark:bg-slate-950/40">
                            <td colSpan={6} className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">
                              {lead.message}
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

export default Prospects;
