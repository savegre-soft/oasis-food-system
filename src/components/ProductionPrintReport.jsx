import { useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { groupByRecipe } from './Kitchen';

// ── Helpers ───────────────────────────────────────────────────────────────────

const round1 = (n) => Math.round(n * 10) / 10;

const fmt = (val, unit) => {
  if (val == null || isNaN(Number(val))) return null;
  return round1(Number(val)) + (unit ?? 'g');
};

// Build full summary from grouped recipes
// Aggregate ingredient counts across all recipe variants weighted by units
const buildIngBreakdown = (recipes, category, totalMacro, macroUnit) => {
  const breakdown = {};
  for (const r of recipes) {
    const ings = r.effectiveIngredients?.[category] ?? [];
    if (ings.length === 0) continue;
    // Distribute total macro evenly across ingredients of that category
    const share = (totalMacro ?? 0) / ings.length;
    for (const name of ings) {
      if (!breakdown[name]) breakdown[name] = { total: 0, unit: macroUnit ?? 'g', units: 0 };
      breakdown[name].total += share;
      breakdown[name].units += r.totalUnits;
    }
  }
  return Object.entries(breakdown)
    .map(([name, { total, unit, units }]) => ({ name, total: round1(total), unit, units }))
    .sort((a, b) => b.units - a.units || b.total - a.total);
};

// Count unique ingredient occurrences × units (for carb/extra — no macro value)
const buildIngCount = (recipes, category) => {
  const counts = {};
  for (const r of recipes) {
    const ings = r.effectiveIngredients?.[category] ?? [];
    for (const name of ings) {
      if (!counts[name]) counts[name] = 0;
      counts[name] += r.totalUnits;
    }
  }
  return Object.entries(counts)
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units);
};

const buildSummary = (grouped) => {
  let totalProtein = 0, totalCarb = 0, proteinUnit = 'g', carbUnit = 'g';
  const recipes = Object.values(grouped).sort((a, b) => b.totalUnits - a.totalUnits);

  for (const r of recipes) {
    if (r.totalProtein != null) { totalProtein += r.totalProtein; proteinUnit = r.totalProteinUnit ?? 'g'; }
    if (r.totalCarb    != null) { totalCarb    += r.totalCarb;    carbUnit    = r.totalCarbUnit    ?? 'g'; }
  }

  const proteinByType = buildIngBreakdown(recipes, 'protein', totalProtein, proteinUnit);
  const carbByType    = buildIngCount(recipes, 'carb');
  const extraByType   = buildIngCount(recipes, 'extra');

  return { recipes, totalProtein, totalCarb, proteinUnit, carbUnit, proteinByType, carbByType, extraByType };
};

// ── Print styles ──────────────────────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #oasis-print-report, #oasis-print-report * { visibility: visible !important; }
  #oasis-print-report {
    position: fixed !important;
    top: 0; left: 0;
    width: 100%;
    background: white;
    z-index: 99999;
  }
  @page { margin: 1.5cm; size: A4; }
}
`;

// ── Component ─────────────────────────────────────────────────────────────────

const ProductionPrintReport = ({ orderDays, slotLabel, weekLabel, onClose }) => {
  const styleRef    = useRef(null);
  const printDivRef = useRef(null);

  const grouped = groupByRecipe(orderDays ?? []);
  const { recipes, totalProtein, totalCarb, proteinUnit, carbUnit, proteinByType, carbByType, extraByType } = buildSummary(grouped);
  const totalUnits = recipes.reduce((s, r) => s + r.totalUnits, 0);

  const today = new Date().toLocaleDateString('es-CR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  // Inject CSS + create print div appended directly to body
  useEffect(() => {
    // CSS
    const style = document.createElement('style');
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    styleRef.current = style;

    // Print container — appended to body so it's never nested under modal
    const div = document.createElement('div');
    div.id = 'oasis-print-report';
    div.style.cssText = 'display:none; font-family:system-ui,sans-serif; color:#1e293b; padding:0;';
    document.body.appendChild(div);
    printDivRef.current = div;

    return () => {
      if (styleRef.current)    document.head.removeChild(styleRef.current);
      if (printDivRef.current) document.body.removeChild(printDivRef.current);
    };
  }, []);

  const handlePrint = () => {
    const div = printDivRef.current;
    if (!div) return;

    // Build print HTML from current data
    div.innerHTML = buildPrintHTML({
      recipes, totalProtein, totalCarb, proteinUnit, carbUnit,
      proteinByType, carbByType, extraByType, totalUnits, slotLabel, weekLabel, today,
    });

    div.style.display = 'block';

    // Let browser render before printing
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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Resumen de Producción</h2>
            {(slotLabel || weekLabel) && (
              <p className="text-xs text-slate-400 mt-0.5">
                {[slotLabel, weekLabel].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
            >
              <Printer size={15} /> Imprimir / PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {recipes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No hay datos de producción para este slot</p>
            </div>
          ) : (
            <>
              {/* ── Macro summary cards ── */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Total Proteínas</p>
                  <p className="text-3xl font-bold text-amber-800">{fmt(totalProtein, proteinUnit) ?? '—'}</p>
                  <p className="text-xs text-amber-600 mt-1">en todos los platos</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Total Carbohidratos</p>
                  <p className="text-3xl font-bold text-blue-800">{fmt(totalCarb, carbUnit) ?? '—'}</p>
                  <p className="text-xs text-blue-600 mt-1">en todos los platos</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Unidades totales</p>
                  <p className="text-3xl font-bold text-slate-800">{totalUnits}</p>
                  <p className="text-xs text-slate-400 mt-1">{recipes.length} receta{recipes.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* ── Ingredient breakdowns ── */}
              {(proteinByType.length > 0 || carbByType.length > 0 || extraByType.length > 0) && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Desglose por ingrediente</p>

                  {proteinByType.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-2">🥩 Proteínas</p>
                      <div className="grid grid-cols-2 gap-2">
                        {proteinByType.map(({ name, total, unit, units }) => (
                          <div key={name} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-red-800">{name}</p>
                              <p className="text-xs text-red-400">{units} plato{units !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="text-sm font-bold text-red-700">{fmt(total, unit) ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {carbByType.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-amber-600 mb-2">🍚 Carbohidratos</p>
                      <div className="grid grid-cols-2 gap-2">
                        {carbByType.map(({ name, units }) => (
                          <div key={name} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                            <span className="text-sm font-medium text-amber-800">{name}</span>
                            <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{units}×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {extraByType.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-2">🥗 Extras</p>
                      <div className="grid grid-cols-2 gap-2">
                        {extraByType.map(({ name, units }) => (
                          <div key={name} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                            <span className="text-sm font-medium text-green-800">{name}</span>
                            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{units}×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Recipe table ── */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Platos a preparar</p>
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Receta</th>
                        <th className="text-left px-4 py-3 font-semibold">Ingredientes</th>
                        <th className="text-center px-4 py-3 font-semibold w-16">Cant.</th>
                        <th className="text-center px-4 py-3 font-semibold w-24">Proteína</th>
                        <th className="text-center px-4 py-3 font-semibold w-24">Carbos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recipes.map((r, idx) => {
                        const ings    = r.effectiveIngredients ?? {};
                        const protein = ings.protein ?? [];
                        const carb    = ings.carb    ?? [];
                        const extra   = ings.extra   ?? [];
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition align-top">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded-lg min-w-[28px] text-center">
                                  {r.totalUnits}
                                </span>
                                <span className="font-semibold text-slate-800">{r.recipe_name}</span>
                                {r.isOverridden && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">variante</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {protein.map((n, i) => <span key={'p'+i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{n}</span>)}
                                {carb.map((n, i)    => <span key={'c'+i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{n}</span>)}
                                {extra.map((n, i)   => <span key={'e'+i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{n}</span>)}
                                {protein.length + carb.length + extra.length === 0 && (
                                  <span className="text-xs text-slate-300 italic">Sin ingredientes</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-800">{r.totalUnits}</td>
                            <td className="px-4 py-3 text-center font-semibold text-amber-700">
                              {fmt(r.totalProtein, r.totalProteinUnit) ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-700">
                              {fmt(r.totalCarb, r.totalCarbUnit) ?? '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Totales</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{totalUnits}</td>
                        <td className="px-4 py-3 text-center font-bold text-amber-700">{fmt(totalProtein, proteinUnit) ?? '—'}</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700">{fmt(totalCarb, carbUnit) ?? '—'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── HTML string for print div ─────────────────────────────────────────────────
// Built as a string so it renders synchronously before window.print() fires

function buildPrintHTML({ recipes, totalProtein, totalCarb, proteinUnit, carbUnit, proteinByType, carbByType, extraByType, totalUnits, slotLabel, weekLabel, today }) {
  const fmtS = (val, unit) => {
    if (val == null || isNaN(Number(val))) return '—';
    return (Math.round(Number(val) * 10) / 10) + (unit ?? 'g');
  };

  const catColor = { protein: '#dc2626', carb: '#d97706', extra: '#16a34a' };

  const ingBadge = (name, cat) =>
    '<span style="font-size:11px;padding:1px 6px;border-radius:4px;background:#f1f5f9;color:' + (catColor[cat] ?? '#475569') + ';font-weight:500;margin:2px;">' + name + '</span>';

  const recipeRows = recipes.map((r, i) => {
    const ings    = r.effectiveIngredients ?? {};
    const allIngs = [
      ...(ings.protein ?? []).map(n => ingBadge(n, 'protein')),
      ...(ings.carb    ?? []).map(n => ingBadge(n, 'carb')),
      ...(ings.extra   ?? []).map(n => ingBadge(n, 'extra')),
    ].join('');

    return '<tr style="background:' + (i % 2 === 0 ? '#fff' : '#f8fafc') + ';border-bottom:1px solid #f1f5f9;">'
      + '<td style="padding:10px 12px;vertical-align:top;">'
        + '<span style="display:inline-block;background:#0f172a;color:#fff;border-radius:6px;padding:2px 7px;font-weight:700;font-size:13px;min-width:28px;text-align:center;margin-right:8px;">' + r.totalUnits + '</span>'
        + '<strong>' + r.recipe_name + '</strong>'
        + (r.isOverridden ? ' <span style="font-size:10px;background:#dbeafe;color:#1d4ed8;border-radius:4px;padding:1px 5px;">variante</span>' : '')
      + '</td>'
      + '<td style="padding:10px 12px;vertical-align:top;">' + (allIngs || '<em style="color:#94a3b8;font-size:11px;">Sin ingredientes</em>') + '</td>'
      + '<td style="padding:10px 12px;text-align:center;font-weight:700;vertical-align:top;">' + r.totalUnits + '</td>'
      + '<td style="padding:10px 12px;text-align:center;color:#92400e;font-weight:600;vertical-align:top;">' + fmtS(r.totalProtein, r.totalProteinUnit) + '</td>'
      + '<td style="padding:10px 12px;text-align:center;color:#1e40af;font-weight:600;vertical-align:top;">' + fmtS(r.totalCarb, r.totalCarbUnit) + '</td>'
      + '</tr>';
  }).join('');

  const proteinTypeRows = proteinByType.map(({ name, total, unit, units }) =>
    '<tr><td style="padding:6px 12px;font-weight:600;color:#991b1b;">' + name + '</td>'
    + '<td style="padding:6px 12px;text-align:center;color:#64748b;font-size:11px;">' + units + '×</td>'
    + '<td style="padding:6px 12px;text-align:right;font-weight:700;color:#b91c1c;">' + fmtS(total, unit) + '</td></tr>'
  ).join('');

  const carbTypeRows = (carbByType ?? []).map(({ name, units }) =>
    '<tr><td style="padding:6px 12px;font-weight:600;color:#92400e;">' + name + '</td>'
    + '<td style="padding:6px 12px;text-align:right;font-weight:700;color:#b45309;">' + units + ' plato' + (units !== 1 ? 's' : '') + '</td></tr>'
  ).join('');

  const extraTypeRows = (extraByType ?? []).map(({ name, units }) =>
    '<tr><td style="padding:6px 12px;font-weight:600;color:#166534;">' + name + '</td>'
    + '<td style="padding:6px 12px;text-align:right;font-weight:700;color:#15803d;">' + units + ' plato' + (units !== 1 ? 's' : '') + '</td></tr>'
  ).join('');

  const headerLine = [slotLabel, weekLabel, today].filter(Boolean).join(' · ');

  return '<div style="padding:0 8px;">'
    + '<div style="margin-bottom:20px;border-bottom:2px solid #e2e8f0;padding-bottom:12px;">'
      + '<h1 style="font-size:22px;font-weight:700;margin:0;">Resumen de Producción</h1>'
      + '<p style="font-size:12px;color:#64748b;margin:4px 0 0;">' + headerLine + '</p>'
    + '</div>'

    // Summary boxes
    + '<div style="display:flex;gap:16px;margin-bottom:24px;">'
      + '<div style="flex:1;border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px 16px;">'
        + '<p style="font-size:10px;color:#92400e;font-weight:600;text-transform:uppercase;margin:0 0 4px;">Total Proteínas</p>'
        + '<p style="font-size:24px;font-weight:700;color:#92400e;margin:0;">' + fmtS(totalProtein, proteinUnit) + '</p>'
      + '</div>'
      + '<div style="flex:1;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px 16px;">'
        + '<p style="font-size:10px;color:#1e40af;font-weight:600;text-transform:uppercase;margin:0 0 4px;">Total Carbohidratos</p>'
        + '<p style="font-size:24px;font-weight:700;color:#1e40af;margin:0;">' + fmtS(totalCarb, carbUnit) + '</p>'
      + '</div>'
      + '<div style="flex:1;border:1px solid #e2e8f0;background:#f8fafc;border-radius:10px;padding:12px 16px;">'
        + '<p style="font-size:10px;color:#475569;font-weight:600;text-transform:uppercase;margin:0 0 4px;">Unidades</p>'
        + '<p style="font-size:24px;font-weight:700;color:#0f172a;margin:0;">' + totalUnits + '</p>'
      + '</div>'
    + '</div>'

    // Protein by type
    + ((proteinByType.length > 0 || (carbByType ?? []).length > 0 || (extraByType ?? []).length > 0)
      ? '<div style="margin-bottom:24px;">'
          + '<h2 style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin:0 0 12px;">Desglose por ingrediente</h2>'
          + '<div style="display:flex;gap:16px;">'

          + (proteinByType.length > 0
            ? '<div style="flex:1;">'
                + '<p style="font-size:11px;font-weight:600;color:#991b1b;margin:0 0 6px;">🥩 Proteínas</p>'
                + '<table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #fee2e2;">'
                  + '<thead><tr style="background:#fef2f2;">'
                    + '<th style="text-align:left;padding:5px 10px;font-weight:600;color:#991b1b;font-size:10px;">Fuente</th>'
                    + '<th style="text-align:center;padding:5px 10px;font-weight:600;color:#991b1b;font-size:10px;">Platos</th>'
                    + '<th style="text-align:right;padding:5px 10px;font-weight:600;color:#991b1b;font-size:10px;">Total</th>'
                  + '</tr></thead>'
                  + '<tbody>' + proteinTypeRows + '</tbody>'
                + '</table>'
              + '</div>'
            : '')

          + ((carbByType ?? []).length > 0
            ? '<div style="flex:1;">'
                + '<p style="font-size:11px;font-weight:600;color:#92400e;margin:0 0 6px;">🍚 Carbohidratos</p>'
                + '<table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #fde68a;">'
                  + '<thead><tr style="background:#fffbeb;">'
                    + '<th style="text-align:left;padding:5px 10px;font-weight:600;color:#92400e;font-size:10px;">Ingrediente</th>'
                    + '<th style="text-align:right;padding:5px 10px;font-weight:600;color:#92400e;font-size:10px;">Platos</th>'
                  + '</tr></thead>'
                  + '<tbody>' + carbTypeRows + '</tbody>'
                + '</table>'
              + '</div>'
            : '')

          + ((extraByType ?? []).length > 0
            ? '<div style="flex:1;">'
                + '<p style="font-size:11px;font-weight:600;color:#166534;margin:0 0 6px;">🥗 Extras</p>'
                + '<table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #bbf7d0;">'
                  + '<thead><tr style="background:#f0fdf4;">'
                    + '<th style="text-align:left;padding:5px 10px;font-weight:600;color:#166534;font-size:10px;">Ingrediente</th>'
                    + '<th style="text-align:right;padding:5px 10px;font-weight:600;color:#166534;font-size:10px;">Platos</th>'
                  + '</tr></thead>'
                  + '<tbody>' + extraTypeRows + '</tbody>'
                + '</table>'
              + '</div>'
            : '')

          + '</div>'
        + '</div>'
      : '')

    // Recipe table
    + '<h2 style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin:0 0 10px;">Platos a preparar</h2>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
      + '<thead><tr style="background:#f1f5f9;">'
        + '<th style="text-align:left;padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Receta</th>'
        + '<th style="text-align:left;padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Ingredientes</th>'
        + '<th style="text-align:center;padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;width:50px;">Cant.</th>'
        + '<th style="text-align:center;padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;width:80px;">Proteína</th>'
        + '<th style="text-align:center;padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;width:80px;">Carbos</th>'
      + '</tr></thead>'
      + '<tbody>' + recipeRows + '</tbody>'
      + '<tfoot><tr style="background:#f1f5f9;border-top:2px solid #e2e8f0;">'
        + '<td colspan="2" style="padding:10px 12px;font-weight:700;font-size:13px;">TOTALES</td>'
        + '<td style="padding:10px 12px;text-align:center;font-weight:700;">' + totalUnits + '</td>'
        + '<td style="padding:10px 12px;text-align:center;font-weight:700;color:#92400e;">' + fmtS(totalProtein, proteinUnit) + '</td>'
        + '<td style="padding:10px 12px;text-align:center;font-weight:700;color:#1e40af;">' + fmtS(totalCarb, carbUnit) + '</td>'
      + '</tr></tfoot>'
    + '</table>'

    + '<p style="margin-top:28px;font-size:10px;color:#94a3b8;text-align:center;">Generado por Oasis Food System · ' + today + '</p>'
  + '</div>';
}

export default ProductionPrintReport;