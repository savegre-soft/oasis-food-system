// Tooltip CSS-only (sin JS/estado) para botones de solo-ícono en tablas del
// panel interno. Reemplaza al atributo `title=` nativo del navegador, que
// depende de un temporizador de hover inconsistente entre navegadores/SO.
const Tooltip = ({ label, children }) => (
  <span className="relative inline-flex group">
    {children}
    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 scale-95 transition group-hover:opacity-100 group-hover:scale-100 z-50">
      {label}
    </span>
  </span>
);

export default Tooltip;
