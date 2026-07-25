import { useEffect, useRef } from 'react';
import { X, Printer, Package, UtensilsCrossed } from 'lucide-react';
import { COMBO_CATEGORY_LABEL, aggregateComboSelections, groupByCategory, formatComboQuantity } from '../comboUtils';

const PRINT_STYLES = `
@media print {
  body > *:not(#oasis-combo-print-report) { display: none !important; }
  #oasis-combo-print-report {
    display: block !important;
    width: 100%;
    background: white;
  }
  @page { margin: 1.5cm; size: A4; }
}
`;

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// orders: combo_orders (id_combo_order, price, status, clients(name),
// combo_order_selections(combo_items())) — misma forma que ComboDeliveryView.
// Se excluyen los CANCELLED del resumen de producción/ingresos.
const ComboPrintReport = ({ orders, weekLabel, onClose }) => {
  const styleRef = useRef(null);
  const printDivRef = useRef(null);

  const activeOrders = (orders ?? []).filter((o) => o.status !== 'CANCELLED');
  const aggregated = aggregateComboSelections(activeOrders);
  const groups = groupByCategory(aggregated);
  const totalOrders = activeOrders.length;
  const totalItems = aggregated.reduce((sum, r) => sum + r.count, 0);

  const today = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    styleRef.current = style;

    const div = document.createElement('div');
    div.id = 'oasis-combo-print-report';
    div.style.cssText = 'display:none; font-family:system-ui,sans-serif; color:#1e293b; padding:0;';
    document.body.appendChild(div);
    printDivRef.current = div;

    return () => {
      if (styleRef.current) document.head.removeChild(styleRef.current);
      if (printDivRef.current) document.body.removeChild(printDivRef.current);
    };
  }, []);

  const handlePrint = () => {
    const div = printDivRef.current;
    if (!div) return;

    div.innerHTML = buildPrintHTML({ groups, totalOrders, totalItems, weekLabel, today });

    div.style.display = 'block';
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        div.style.display = 'none';
      }, 150);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Resumen de Combos</h2>
            {weekLabel && <p className="text-xs text-slate-400 mt-0.5">{weekLabel}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <Printer size={14} /> Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-7">
          {aggregated.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <UtensilsCrossed size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay pedidos de combo para este rango</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard label="Pedidos" value={totalOrders} icon={<Package size={16} className="text-slate-400" />} />
                <SummaryCard label="Ítems totales" value={totalItems} icon={<UtensilsCrossed size={16} className="text-slate-400" />} />
              </div>

              {groups.map((group) => (
                <section key={group.category}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    {COMBO_CATEGORY_LABEL[group.category] ?? group.category}
                  </p>
                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-50">
                        {group.items.map((row, idx) => (
                          <tr key={row.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                            <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                              {formatComboQuantity(row.category, row.count, row.portion_size_g)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon }) => (
  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
    <div className="flex items-center gap-1.5 mb-2">
      {icon}
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
    <p className="text-2xl font-bold leading-none text-slate-800">{value}</p>
  </div>
);

function buildPrintHTML({ groups, totalOrders, totalItems, weekLabel, today }) {
  const groupSections = groups
    .map((group) => {
      const rows = group.items
        .map(
          (row, i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};border-bottom:1px solid #f1f5f9;">
        <td style="padding:8px 10px;font-weight:600;">${escapeHtml(row.name)}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:700;">${escapeHtml(formatComboQuantity(row.category, row.count, row.portion_size_g))}</td>
      </tr>`
        )
        .join('');
      return `<div style="margin-bottom:16px;page-break-inside:avoid;">
        <p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px;">${escapeHtml(COMBO_CATEGORY_LABEL[group.category] ?? group.category)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e2e8f0;">
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    })
    .join('');

  return `<div style="padding:0 4px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:18px;">
      <div>
        <h1 style="font-size:20px;font-weight:800;margin:0;letter-spacing:-0.3px;">Resumen de Combos</h1>
        ${weekLabel ? `<p style="font-size:11px;color:#64748b;margin:3px 0 0;">${escapeHtml(weekLabel)}</p>` : ''}
      </div>
      <p style="font-size:10px;color:#94a3b8;margin:0;text-align:right;">${escapeHtml(today)}</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px;">
      <div style="flex:1;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:10px 14px;">
        <p style="font-size:9px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Pedidos</p>
        <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0;">${totalOrders}</p>
      </div>
      <div style="flex:1;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:10px 14px;">
        <p style="font-size:9px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Ítems totales</p>
        <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0;">${totalItems}</p>
      </div>
    </div>

    ${groupSections}

    <p style="margin-top:24px;font-size:9px;color:#cbd5e1;text-align:center;border-top:1px solid #f1f5f9;padding-top:10px;">
      Generado por Oasis Food System · ${escapeHtml(today)}
    </p>
  </div>`;
}

export default ComboPrintReport;
