import { useState, useEffect } from 'react';
import { Settings2, Plus, Package, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { sileo } from 'sileo';
import { useApp } from '../../context/AppContext';

import Modal from '../Modal';
import ComboWeekBuilder from './ComboWeekBuilder';
import AddComboOrder from './AddComboOrder';
import ComboOrderCard from './ComboOrderCard';

const COMBO_WEEK_SELECT = `
  id_combo_week, week_start_date, week_end_date, base_price, status, image_url,
  combo_week_categories (
    id_combo_week_category, category, max_selections,
    combo_week_category_items (
      id_combo_week_category_item, combo_item_id, extra_price,
      combo_items ( id_combo_item, name, portion_size_g, category )
    )
  )
`;

const ComboOrdersTab = () => {
  const { supabase } = useApp();

  const [comboWeek, setComboWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const getComboWeek = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('combo_weeks')
      .select(COMBO_WEEK_SELECT)
      .eq('status', 'open')
      .order('id_combo_week', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error(error);
    setComboWeek(data ?? null);
    setLoading(false);
  };

  const getOrders = async (weekId) => {
    if (!weekId) {
      setOrders([]);
      return;
    }
    const { data, error } = await supabase
      .schema('operations')
      .from('combo_orders')
      .select(
        `id_combo_order, delivery_date, price, status, notes,
         clients ( id_client, name ),
         combo_order_selections ( id_combo_order_selection, category, combo_items ( name, portion_size_g ) )`
      )
      .eq('combo_week_id', weekId)
      .order('id_combo_order', { ascending: false });
    if (error) console.error(error);
    setOrders(data ?? []);
  };

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .schema('operations')
        .from('clients')
        .select('id_client, name')
        .order('name');
      setClients(data ?? []);
    };
    fetchClients();
    getComboWeek();
  }, []);

  useEffect(() => {
    getOrders(comboWeek?.id_combo_week);
  }, [comboWeek]);

  const closeBuilder = () => {
    setShowBuilder(false);
    getComboWeek();
  };

  const closeAddOrder = () => {
    setShowAddOrder(false);
    getOrders(comboWeek?.id_combo_week);
  };

  const generateImage = async () => {
    if (!comboWeek) return;
    setGeneratingImage(true);
    const { error } = await supabase.functions.invoke('generate-combo-image', {
      body: { comboWeekId: comboWeek.id_combo_week },
    });
    setGeneratingImage(false);
    if (error) {
      console.error(error);
      let detail = '';
      try {
        detail = (await error.context?.json())?.error ?? '';
      } catch {
        // el body del error no era JSON parseable; se ignora y se usa el mensaje genérico
      }
      if (/billing|payment|pago|hard limit|insufficient_quota/i.test(detail)) {
        sileo.error({
          title: 'Sin saldo en OpenAI',
          description:
            'La cuenta de OpenAI no tiene saldo o alcanzó su límite de pago. Revisa el billing en platform.openai.com.',
        });
      } else {
        sileo.error({ title: 'No se pudo generar la imagen del combo' });
      }
      return;
    }
    sileo.success({ title: 'Imagen generada' });
    getComboWeek();
  };

  if (loading) return <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>;

  return (
    <>
      <AnimatePresence>
        {showBuilder && (
          <Modal isOpen={showBuilder} onClose={closeBuilder}>
            <ComboWeekBuilder onSuccess={closeBuilder} />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddOrder && comboWeek && (
          <Modal isOpen={showAddOrder} onClose={closeAddOrder}>
            <AddComboOrder comboWeek={comboWeek} clients={clients} onSuccess={closeAddOrder} />
          </Modal>
        )}
      </AnimatePresence>

      {!comboWeek ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-600">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="mb-4">No hay un combo configurado para esta semana</p>
          <button
            onClick={() => setShowBuilder(true)}
            className="inline-flex items-center gap-2 bg-green-800 dark:bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 dark:hover:bg-green-500 transition text-sm font-medium"
          >
            <Settings2 size={16} /> Configurar combo de la semana
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4 min-w-0">
              {comboWeek.image_url && (
                <img
                  src={comboWeek.image_url}
                  alt="Combo de la semana"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">
                  Combo de la semana
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  Precio base: <span className="font-semibold">₡{Number(comboWeek.base_price).toLocaleString('es-CR')}</span>
                  {' · '}
                  {(comboWeek.combo_week_categories ?? []).length} categorías configuradas
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowBuilder(true)}
                className="flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl hover:border-slate-400 transition"
              >
                <Settings2 size={13} /> Reconfigurar
              </button>
              <button
                onClick={generateImage}
                disabled={generatingImage}
                className="flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl hover:border-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingImage ? (
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                {generatingImage
                  ? 'Generando…'
                  : comboWeek.image_url
                    ? 'Regenerar imagen'
                    : 'Generar imagen con IA'}
              </button>
              <button
                onClick={() => setShowAddOrder(true)}
                className="flex items-center gap-1.5 text-xs font-medium bg-green-800 dark:bg-green-600 text-white px-3 py-2 rounded-xl hover:bg-green-700 dark:hover:bg-green-500 transition"
              >
                <Plus size={13} /> Nuevo pedido de combo
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-14 text-slate-400 dark:text-slate-600">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p>Sin pedidos de combo registrados esta semana</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <ComboOrderCard key={o.id_combo_order} order={o} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ComboOrdersTab;
