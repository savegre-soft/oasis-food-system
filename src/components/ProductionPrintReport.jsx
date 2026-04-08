import { useEffect, useRef } from 'react';
import { X, Printer, FlameKindling, Wheat, Salad, UtensilsCrossed } from 'lucide-react';
import { groupByRecipe } from './Kitchen';

// ── Helpers ───────────────────────────────────────────────────────────────────

const round1 = (n) => Math.round(n * 10) / 10;

const fmt = (val, unit) => {
  if (val == null || isNaN(Number(val))) return null;
  return round1(Number(val)) + (unit ?? 'g');
};

/**
 * Distribuye el macro de CADA receta entre sus ingredientes de esa categoría.
 * Devuelve [{ name, total, unit, units }] ordenado por unidades desc.
 */
const buildIngBreakdown = (recipes, category, macroKey, macroUnitKey) => {
  const breakdown = {};
  for (const r of recipes) {
    const ings = r.effectiveIngredients?.[category] ?? [];
    if (ings.length === 0) continue;
    const macro = r[macroKey] ?? 0;
    const unit = r[macroUnitKey] ?? 'g';
    const share = macro / ings.length; // porción por ingrediente (de esta receta)
    for (const name of ings) {
      if (!breakdown[name]) breakdown[name] = { total: 0, unit, units: 0 };
      breakdown[name].total += share;
      breakdown[name].units += r.totalUnits;
    }
  }
  return Object.entries(breakdown)
    .map(([name, { total, unit, units }]) => ({ name, total: round1(total), unit, units }))
    .sort((a, b) => b.units - a.units || b.total - a.total);
};

/**
 * Cuenta platos por ingrediente (para extras, que no tienen valor en gramos).
 */
const buildIngCount = (recipes, category) => {
  const counts = {};
  for (const r of recipes) {
    for (const name of r.effectiveIngredients?.[category] ?? []) {
      if (!counts[name]) counts[name] = 0;
      counts[name] += r.totalUnits;
    }
  }
  return Object.entries(counts)
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units);
};

const buildSummary = (grouped) => {
  let totalProtein = 0,
    totalCarb = 0,
    proteinUnit = 'g',
    carbUnit = 'g';
  const recipes = Object.values(grouped).sort((a, b) => b.totalUnits - a.totalUnits);

  for (const r of recipes) {
    if (r.totalProtein != null) {
      totalProtein += r.totalProtein;
      proteinUnit = r.totalProteinUnit ?? 'g';
    }
    if (r.totalCarb != null) {
      totalCarb += r.totalCarb;
      carbUnit = r.totalCarbUnit ?? 'g';
    }
  }

  // Ahora ambas categorías usan buildIngBreakdown (mismo criterio: gramos por ingrediente)
  const proteinByType = buildIngBreakdown(recipes, 'protein', 'totalProtein', 'totalProteinUnit');
  const carbByType = buildIngBreakdown(recipes, 'carb', 'totalCarb', 'totalCarbUnit');
  const extraByType = buildIngCount(recipes, 'extra');

  return {
    recipes,
    totalProtein,
    totalCarb,
    proteinUnit,
    carbUnit,
    proteinByType,
    carbByType,
    extraByType,
  };
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
  const styleRef = useRef(null);
  const printDivRef = useRef(null);

  const grouped = groupByRecipe(orderDays ?? []);
  const {
    recipes,
    totalProtein,
    totalCarb,
    proteinUnit,
    carbUnit,
    proteinByType,
    carbByType,
    extraByType,
  } = buildSummary(grouped);
  const totalUnits = recipes.reduce((s, r) => s + r.totalUnits, 0);
  const totalExtras = extraByType.reduce((s, e) => s + e.units, 0);

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
    div.id = 'oasis-print-report';
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

    div.innerHTML = buildPrintHTML({
      recipes,
      totalProtein,
      totalCarb,
      proteinUnit,
      carbUnit,
      proteinByType,
      carbByType,
      extraByType,
      totalUnits,
      totalExtras,
      slotLabel,
      weekLabel,
      today,
    });

    div.style.display = 'block';
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        div.style.display = 'none';
      }, 150);
    });
  };

  const hasBreakdown = proteinByType.length > 0 || carbByType.length > 0 || extraByType.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
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
          {recipes.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <UtensilsCrossed size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay datos de producción para este slot</p>
            </div>
          ) : (
            <>
              {/* ── Tarjetas de resumen ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryCard
                  label="Proteínas"
                  value={fmt(totalProtein, proteinUnit) ?? '—'}
                  sub={`${proteinByType.length} tipo${proteinByType.length !== 1 ? 's' : ''}`}
                  colorClass="bg-red-50 border-red-200 text-red-800"
                  subClass="text-red-500"
                  icon={<FlameKindling size={16} className="text-red-500" />}
                />
                <SummaryCard
                  label="Carbohidratos"
                  value={fmt(totalCarb, carbUnit) ?? '—'}
                  sub={`${carbByType.length} tipo${carbByType.length !== 1 ? 's' : ''}`}
                  colorClass="bg-amber-50 border-amber-200 text-amber-800"
                  subClass="text-amber-500"
                  icon={<Wheat size={16} className="text-amber-500" />}
                />
                <SummaryCard
                  label="Extras"
                  value={totalExtras > 0 ? `${totalExtras}×` : '—'}
                  sub={`${extraByType.length} tipo${extraByType.length !== 1 ? 's' : ''}`}
                  colorClass="bg-green-50 border-green-200 text-green-800"
                  subClass="text-green-500"
                  icon={<Salad size={16} className="text-green-500" />}
                />
                <SummaryCard
                  label="Unidades"
                  value={totalUnits}
                  sub={`${recipes.length} receta${recipes.length !== 1 ? 's' : ''}`}
                  colorClass="bg-slate-50 border-slate-200 text-slate-800"
                  subClass="text-slate-400"
                  icon={<UtensilsCrossed size={16} className="text-slate-400" />}
                />
              </div>

              {/* ── Desglose por ingrediente ── */}
              {hasBreakdown && (
                <section>
                  <SectionTitle>Desglose por ingrediente</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Proteínas */}
                    {proteinByType.length > 0 && (
                      <BreakdownCard
                        title="🥩 Proteínas"
                        headerClass="text-red-700"
                        total={fmt(totalProtein, proteinUnit)}
                        totalLabel="Total"
                        totalClass="text-red-600"
                      >
                        {proteinByType.map(({ name, total, unit, units }) => (
                          <IngRow
                            key={name}
                            name={name}
                            right={fmt(total, unit) ?? '—'}
                            sub={`${units} plato${units !== 1 ? 's' : ''}`}
                            rightClass="text-red-700 font-bold"
                          />
                        ))}
                      </BreakdownCard>
                    )}

                    {/* Carbohidratos */}
                    {carbByType.length > 0 && (
                      <BreakdownCard
                        title="🍚 Carbohidratos"
                        headerClass="text-amber-700"
                        total={fmt(totalCarb, carbUnit)}
                        totalLabel="Total"
                        totalClass="text-amber-600"
                      >
                        {carbByType.map(({ name, total, unit, units }) => (
                          <IngRow
                            key={name}
                            name={name}
                            right={fmt(total, unit) ?? '—'}
                            sub={`${units} plato${units !== 1 ? 's' : ''}`}
                            rightClass="text-amber-700 font-bold"
                          />
                        ))}
                      </BreakdownCard>
                    )}

                    {/* Extras */}
                    {extraByType.length > 0 && (
                      <BreakdownCard
                        title="🥗 Extras"
                        headerClass="text-green-700"
                        total={totalExtras > 0 ? `${totalExtras}×` : null}
                        totalLabel="Total platos"
                        totalClass="text-green-600"
                      >
                        {extraByType.map(({ name, units }) => (
                          <IngRow
                            key={name}
                            name={name}
                            right={`${units}×`}
                            rightClass="text-green-700 font-bold"
                          />
                        ))}
                      </BreakdownCard>
                    )}
                  </div>
                </section>
              )}

              {/* ── Tabla de platos ── */}
              <section>
                <SectionTitle>Platos a preparar</SectionTitle>
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-white text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">#</th>
                        <th className="text-left px-4 py-3 font-semibold">Receta</th>
                        <th className="text-left px-4 py-3 font-semibold">Ingredientes</th>
                        <th className="text-center px-4 py-3 font-semibold w-16">Cant.</th>
                        <th className="text-center px-4 py-3 font-semibold w-24">Proteína</th>
                        <th className="text-center px-4 py-3 font-semibold w-24">Carbos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recipes.map((r, idx) => {
                        const ings = r.effectiveIngredients ?? {};
                        const protein = ings.protein ?? [];
                        const carb = ings.carb ?? [];
                        const extra = ings.extra ?? [];
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 transition align-top ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                          >
                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded-lg min-w-[26px] text-center">
                                  {r.totalUnits}
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {r.recipe_name}
                                </span>
                                {r.isOverridden && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                    variante
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {protein.map((n, i) => (
                                  <span
                                    key={'p' + i}
                                    className="text-[11px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full"
                                  >
                                    {n}
                                  </span>
                                ))}
                                {carb.map((n, i) => (
                                  <span
                                    key={'c' + i}
                                    className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full"
                                  >
                                    {n}
                                  </span>
                                ))}
                                {extra.map((n, i) => (
                                  <span
                                    key={'e' + i}
                                    className="text-[11px] bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full"
                                  >
                                    {n}
                                  </span>
                                ))}
                                {protein.length + carb.length + extra.length === 0 && (
                                  <span className="text-xs text-slate-300 italic">
                                    Sin ingredientes
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-800">
                              {r.totalUnits}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-red-600">
                              {fmt(r.totalProtein, r.totalProteinUnit) ?? (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-amber-600">
                              {fmt(r.totalCarb, r.totalCarbUnit) ?? (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-sm">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide"
                        >
                          Totales · {recipes.length} receta{recipes.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {totalUnits}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-red-600">
                          {fmt(totalProtein, proteinUnit) ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-amber-600">
                          {fmt(totalCarb, carbUnit) ?? '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{children}</p>
);

const SummaryCard = ({ label, value, sub, colorClass, subClass, icon }) => (
  <div className={`border rounded-2xl p-4 ${colorClass}`}>
    <div className="flex items-center gap-1.5 mb-2">
      {icon}
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
    </div>
    <p className="text-2xl font-bold leading-none mb-1">{value}</p>
    <p className={`text-xs ${subClass}`}>{sub}</p>
  </div>
);

const BreakdownCard = ({ title, headerClass, total, totalLabel, totalClass, children }) => (
  <div className="border border-slate-100 rounded-2xl overflow-hidden">
    <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-b border-slate-100">
      <span className={`text-xs font-bold uppercase tracking-wide ${headerClass}`}>{title}</span>
      {total && (
        <span className={`text-xs font-bold ${totalClass}`}>
          {totalLabel}: {total}
        </span>
      )}
    </div>
    <div className="divide-y divide-slate-50">{children}</div>
  </div>
);

const IngRow = ({ name, right, sub, rightClass }) => (
  <div className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition">
    <div>
      <p className="text-sm font-medium text-slate-700">{name}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
    <span className={`text-sm ${rightClass ?? 'text-slate-600 font-semibold'}`}>{right}</span>
  </div>
);

// ── HTML string for PDF/print ─────────────────────────────────────────────────

function buildPrintHTML({
  recipes,
  totalProtein,
  totalCarb,
  proteinUnit,
  carbUnit,
  proteinByType,
  carbByType,
  extraByType,
  totalUnits,
  totalExtras,
  slotLabel,
  weekLabel,
  today,
}) {
  const fmtS = (val, unit) => {
    if (val == null || isNaN(Number(val))) return '—';
    return Math.round(Number(val) * 10) / 10 + (unit ?? 'g');
  };

  // ── Tabla de recetas ────────────────────────────────────────────────────────
  const recipeRows = recipes
    .map((r, i) => {
      const ings = r.effectiveIngredients ?? {};
      const badgeFn = (name, bg, color) =>
        `<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:${bg};color:${color};margin:2px;display:inline-block;">${name}</span>`;

      const allIngs = [
        ...(ings.protein ?? []).map((n) => badgeFn(n, '#fef2f2', '#b91c1c')),
        ...(ings.carb ?? []).map((n) => badgeFn(n, '#fffbeb', '#b45309')),
        ...(ings.extra ?? []).map((n) => badgeFn(n, '#f0fdf4', '#15803d')),
      ].join('');

      const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      return `<tr style="background:${rowBg};border-bottom:1px solid #f1f5f9;">
      <td style="padding:9px 10px;color:#94a3b8;font-size:11px;font-family:monospace;width:28px;">${i + 1}</td>
      <td style="padding:9px 10px;vertical-align:top;">
        <span style="display:inline-block;background:#0f172a;color:#fff;border-radius:5px;padding:2px 7px;font-weight:700;font-size:12px;min-width:24px;text-align:center;margin-right:6px;">${r.totalUnits}</span>
        <strong style="font-size:13px;">${r.recipe_name}</strong>
        ${r.isOverridden ? ' <span style="font-size:10px;background:#dbeafe;color:#1d4ed8;border-radius:4px;padding:1px 5px;">variante</span>' : ''}
      </td>
      <td style="padding:9px 10px;vertical-align:top;">${allIngs || '<em style="color:#cbd5e1;font-size:11px;">Sin ingredientes</em>'}</td>
      <td style="padding:9px 10px;text-align:center;font-weight:700;font-size:13px;vertical-align:top;">${r.totalUnits}</td>
      <td style="padding:9px 10px;text-align:center;color:#b91c1c;font-weight:600;font-size:13px;vertical-align:top;">${fmtS(r.totalProtein, r.totalProteinUnit)}</td>
      <td style="padding:9px 10px;text-align:center;color:#b45309;font-weight:600;font-size:13px;vertical-align:top;">${fmtS(r.totalCarb, r.totalCarbUnit)}</td>
    </tr>`;
    })
    .join('');

  // ── Columna de desglose ─────────────────────────────────────────────────────
  const mkBreakdownTable = (title, color, rows, totalLabel, totalVal) =>
    `<div style="flex:1;min-width:0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:700;color:${color};">${title}</span>
        ${totalVal ? `<span style="font-size:10px;font-weight:700;color:${color};">${totalLabel}: ${totalVal}</span>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  const proteinRows = proteinByType
    .map(
      ({ name, total, unit, units }) =>
        `<tr style="border-bottom:1px solid #f8fafc;">
      <td style="padding:6px 10px;font-weight:600;color:#991b1b;">${name}</td>
      <td style="padding:6px 10px;font-size:10px;color:#94a3b8;text-align:center;">${units} plato${units !== 1 ? 's' : ''}</td>
      <td style="padding:6px 10px;text-align:right;font-weight:700;color:#dc2626;">${fmtS(total, unit)}</td>
    </tr>`
    )
    .join('');

  const carbRows = carbByType
    .map(
      ({ name, total, unit, units }) =>
        `<tr style="border-bottom:1px solid #f8fafc;">
      <td style="padding:6px 10px;font-weight:600;color:#92400e;">${name}</td>
      <td style="padding:6px 10px;font-size:10px;color:#94a3b8;text-align:center;">${units} plato${units !== 1 ? 's' : ''}</td>
      <td style="padding:6px 10px;text-align:right;font-weight:700;color:#d97706;">${fmtS(total, unit)}</td>
    </tr>`
    )
    .join('');

  const extraRows = extraByType
    .map(
      ({ name, units }) =>
        `<tr style="border-bottom:1px solid #f8fafc;">
      <td style="padding:6px 10px;font-weight:600;color:#166534;">${name}</td>
      <td style="padding:6px 10px;text-align:right;font-weight:700;color:#16a34a;">${units}×</td>
    </tr>`
    )
    .join('');

  const hasBreakdown = proteinByType.length > 0 || carbByType.length > 0 || extraByType.length > 0;
  const headerLine = [slotLabel, weekLabel].filter(Boolean).join(' · ');

  return `<div style="padding:0 4px;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;">

    <!-- Encabezado -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:18px;">
      <div>
        <h1 style="font-size:20px;font-weight:800;margin:0;letter-spacing:-0.3px;">Resumen de Producción</h1>
        ${headerLine ? `<p style="font-size:11px;color:#64748b;margin:3px 0 0;">${headerLine}</p>` : ''}
      </div>
      <p style="font-size:10px;color:#94a3b8;margin:0;text-align:right;">${today}</p>
    </div>

    <!-- Tarjetas de totales -->
    <div style="display:flex;gap:12px;margin-bottom:20px;">
      <div style="flex:1;border:1px solid #fecaca;background:#fef2f2;border-radius:8px;padding:10px 14px;">
        <p style="font-size:9px;color:#991b1b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Proteínas</p>
        <p style="font-size:22px;font-weight:800;color:#b91c1c;margin:0;">${fmtS(totalProtein, proteinUnit)}</p>
        <p style="font-size:9px;color:#ef4444;margin:2px 0 0;">${proteinByType.length} tipo${proteinByType.length !== 1 ? 's' : ''}</p>
      </div>
      <div style="flex:1;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;padding:10px 14px;">
        <p style="font-size:9px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Carbohidratos</p>
        <p style="font-size:22px;font-weight:800;color:#b45309;margin:0;">${fmtS(totalCarb, carbUnit)}</p>
        <p style="font-size:9px;color:#f59e0b;margin:2px 0 0;">${carbByType.length} tipo${carbByType.length !== 1 ? 's' : ''}</p>
      </div>
      <div style="flex:1;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;padding:10px 14px;">
        <p style="font-size:9px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Extras</p>
        <p style="font-size:22px;font-weight:800;color:#15803d;margin:0;">${totalExtras > 0 ? totalExtras + '×' : '—'}</p>
        <p style="font-size:9px;color:#22c55e;margin:2px 0 0;">${extraByType.length} tipo${extraByType.length !== 1 ? 's' : ''}</p>
      </div>
      <div style="flex:1;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:10px 14px;">
        <p style="font-size:9px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Unidades</p>
        <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0;">${totalUnits}</p>
        <p style="font-size:9px;color:#94a3b8;margin:2px 0 0;">${recipes.length} receta${recipes.length !== 1 ? 's' : ''}</p>
      </div>
    </div>

    ${
      hasBreakdown
        ? `
    <!-- Desglose por ingrediente -->
    <p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px;">Desglose por ingrediente</p>
    <div style="display:flex;gap:12px;margin-bottom:20px;">
      ${proteinByType.length > 0 ? mkBreakdownTable('🥩 Proteínas', '#991b1b', proteinRows, 'Total', fmtS(totalProtein, proteinUnit)) : ''}
      ${carbByType.length > 0 ? mkBreakdownTable('🍚 Carbohidratos', '#92400e', carbRows, 'Total', fmtS(totalCarb, carbUnit)) : ''}
      ${extraByType.length > 0 ? mkBreakdownTable('🥗 Extras', '#166534', extraRows, 'Total', totalExtras > 0 ? totalExtras + '×' : null) : ''}
    </div>`
        : ''
    }

    <!-- Tabla de platos -->
    <p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Platos a preparar</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e2e8f0;">
      <thead>
        <tr style="background:#0f172a;color:#fff;">
          <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:24px;">#</th>
          <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Receta</th>
          <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Ingredientes</th>
          <th style="padding:8px 10px;text-align:center;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:40px;">Cant.</th>
          <th style="padding:8px 10px;text-align:center;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:70px;">Proteína</th>
          <th style="padding:8px 10px;text-align:center;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:70px;">Carbos</th>
        </tr>
      </thead>
      <tbody>${recipeRows}</tbody>
      <tfoot>
        <tr style="background:#f1f5f9;border-top:2px solid #cbd5e1;">
          <td colspan="3" style="padding:9px 10px;font-weight:700;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.03em;">
            Totales · ${recipes.length} receta${recipes.length !== 1 ? 's' : ''}
          </td>
          <td style="padding:9px 10px;text-align:center;font-weight:800;font-size:14px;color:#0f172a;">${totalUnits}</td>
          <td style="padding:9px 10px;text-align:center;font-weight:800;color:#b91c1c;">${fmtS(totalProtein, proteinUnit)}</td>
          <td style="padding:9px 10px;text-align:center;font-weight:800;color:#b45309;">${fmtS(totalCarb, carbUnit)}</td>
        </tr>
      </tfoot>
    </table>

    <p style="margin-top:24px;font-size:9px;color:#cbd5e1;text-align:center;border-top:1px solid #f1f5f9;padding-top:10px;">
      Generado por Oasis Food System · ${today}
    </p>
  </div>`;
}

export default ProductionPrintReport;
