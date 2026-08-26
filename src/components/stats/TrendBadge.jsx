import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

/**
 * Píldora de tendencia: ▲/▼ + % de cambio, con color semántico.
 * `positiveIsGood` invierte los colores para métricas donde subir es malo
 * (p.ej. gastos, % de cobros atrasados).
 */
const TrendBadge = ({ pct, label, positiveIsGood = true }) => {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        <Minus size={11} /> {label ? `Sin dato ${label}` : 'Sin dato previo'}
      </span>
    );
  }

  const isFlat = Math.abs(pct) < 0.5;
  const isPositive = pct > 0;
  const isGood = isFlat ? null : isPositive === positiveIsGood;

  const colorClass = isFlat
    ? 'text-slate-500 dark:text-slate-400'
    : isGood
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400';

  const Icon = isFlat ? Minus : isPositive ? ArrowUp : ArrowDown;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${colorClass}`}>
      <Icon size={11} />
      {Math.abs(pct).toFixed(0)}%{label ? ` ${label}` : ''}
    </span>
  );
};

export default TrendBadge;
