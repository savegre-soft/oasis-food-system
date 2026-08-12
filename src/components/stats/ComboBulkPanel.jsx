import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Hash, TrendingUp, Boxes, Percent } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

import { useApp } from '../../context/AppContext';
import ChartCard from '../ChartCard';
import StatCard from './StatCard';
import { isoWeekMonday, fmtCRC, CATEGORY_COLORS } from '../../utils/chartUtils';
import { aggregateComboSelections } from '../comboUtils';
import { summarizeBatch } from '../bulkSalesUtils';

const COMBO_ORDER_SELECT = `
  id_combo_order, delivery_date, price, status,
  combo_order_selections ( combo_item_id, category, combo_items ( name, category, portion_size_g ) )
`;

const BULK_BATCH_SELECT = `
  id_bulk_sale_batch, batch_date, quantity_cooked,
  bulk_dishes ( name ),
  bulk_sale_entries ( quantity, amount )
`;

// Desglose de ingresos que hoy solo aparecen mezclados en el pie genérico de
// "Ingresos por tipo" de IngresosPanel.jsx (payment_type='combo'/'bulk').
// `payments` ya viene filtrado por dateRange desde Estadisticas.jsx
// (usePaymentStatistics) — el detalle de pedidos/lotes es un fetch propio,
// no está en `payments`.
const ComboBulkPanel = ({ payments, dateRange, loading }) => {
  const { supabase } = useApp();
  const [comboOrders, setComboOrders] = useState([]);
  const [bulkBatches, setBulkBatches] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const run = async () => {
        setFetching(true);
        const [{ data: orders, error: ordersError }, { data: batches, error: batchesError }] =
          await Promise.all([
            supabase
              .schema('operations')
              .from('combo_orders')
              .select(COMBO_ORDER_SELECT)
              .gte('delivery_date', dateRange.from)
              .lte('delivery_date', dateRange.to),
            supabase
              .schema('operations')
              .from('bulk_sale_batches')
              .select(BULK_BATCH_SELECT)
              .gte('batch_date', dateRange.from)
              .lte('batch_date', dateRange.to),
          ]);
        if (ordersError) console.error(ordersError);
        if (batchesError) console.error(batchesError);
        setComboOrders(orders ?? []);
        setBulkBatches(batches ?? []);
        setFetching(false);
      };
      run();
    }, 0);
    return () => clearTimeout(timer);
  }, [supabase, dateRange.from, dateRange.to]);

  const isLoading = loading || fetching;
  const periodLabel = `${dateRange.from} → ${dateRange.to}`;

  const comboPayments = useMemo(
    () => (payments ?? []).filter((p) => p.payment_type === 'combo' && p.status === 'paid'),
    [payments]
  );
  const bulkPayments = useMemo(
    () => (payments ?? []).filter((p) => p.payment_type === 'bulk' && p.status === 'paid'),
    [payments]
  );

  const comboTotal = comboPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const comboOrderCount = comboOrders.length;
  const comboAvg = comboOrderCount > 0 ? comboTotal / comboOrderCount : 0;

  const comboWeeklyData = useMemo(() => {
    const weekMap = {};
    comboPayments.forEach((p) => {
      const wk = isoWeekMonday(p.payment_date);
      weekMap[wk] = (weekMap[wk] || 0) + (p.amount || 0);
    });
    return Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ semana: date.slice(5).replace('-', '/'), total }));
  }, [comboPayments]);

  const comboTopItems = useMemo(
    () =>
      aggregateComboSelections(comboOrders)
        .slice(0, 8)
        .map((row) => ({ name: row.name, value: row.count })),
    [comboOrders]
  );

  const bulkTotal = bulkPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const bulkBatchCount = bulkBatches.length;

  const { totalCooked, totalSold } = useMemo(() => {
    let cooked = 0;
    let sold = 0;
    bulkBatches.forEach((b) => {
      const { quantitySold } = summarizeBatch(b);
      cooked += Number(b.quantity_cooked || 0);
      sold += quantitySold;
    });
    return { totalCooked: cooked, totalSold: sold };
  }, [bulkBatches]);
  const utilizationPct = totalCooked > 0 ? Math.round((totalSold / totalCooked) * 100) : 0;

  const bulkByDish = useMemo(() => {
    const dishMap = {};
    bulkBatches.forEach((b) => {
      const name = b.bulk_dishes?.name ?? 'Sin nombre';
      const { totalIncome } = summarizeBatch(b);
      dishMap[name] = (dishMap[name] || 0) + totalIncome;
    });
    return Object.entries(dishMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [bulkBatches]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Combos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <StatCard icon={<ShoppingBag size={14} />} label="Vendido (combos)" value={isLoading ? '—' : fmtCRC(comboTotal)} sub={periodLabel} accent="text-violet-600" bg="bg-violet-50" iconColor="text-violet-600" />
          <StatCard icon={<Hash size={14} />} label="Pedidos de combo" value={isLoading ? '—' : comboOrderCount.toLocaleString()} sub={periodLabel} accent="text-slate-800" bg="bg-slate-100" iconColor="text-slate-600" />
          <StatCard icon={<TrendingUp size={14} />} label="Precio promedio" value={isLoading ? '—' : fmtCRC(comboAvg)} sub="por pedido" accent="text-slate-800" bg="bg-slate-100" iconColor="text-slate-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Ingresos de combos por semana" sub={periodLabel} loading={isLoading}>
            {comboWeeklyData.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Sin ingresos de combos en el período</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={comboWeeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Vendido']} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Ítems más elegidos en combos" sub={periodLabel} loading={isLoading}>
            {comboTopItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Sin selecciones en el período</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart layout="vertical" data={comboTopItems} margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#cbd5e1" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v, 'Veces elegido']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {comboTopItems.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Ventas Masivas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <StatCard icon={<Boxes size={14} />} label="Vendido (ventas masivas)" value={isLoading ? '—' : fmtCRC(bulkTotal)} sub={periodLabel} accent="text-teal-600" bg="bg-teal-50" iconColor="text-teal-600" />
          <StatCard icon={<Hash size={14} />} label="Lotes cocinados" value={isLoading ? '—' : bulkBatchCount.toLocaleString()} sub={periodLabel} accent="text-slate-800" bg="bg-slate-100" iconColor="text-slate-600" />
          <StatCard icon={<Percent size={14} />} label="Aprovechamiento" value={isLoading ? '—' : `${utilizationPct}%`} sub="vendido / cocinado" accent="text-slate-800" bg="bg-slate-100" iconColor="text-slate-600" />
        </div>

        <ChartCard title="Ingresos de ventas masivas por plato" sub={periodLabel} loading={isLoading}>
          {bulkByDish.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin ventas masivas en el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={bulkByDish} margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#cbd5e1" tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtCRC(v), 'Vendido']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {bulkByDish.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default ComboBulkPanel;
