import { Zap } from 'lucide-react';

const StepClient = ({
  clients,
  clientSearch,
  setClientSearch,
  selectedClient,
  setSelectedClient,
  familyClient,
  isExpress,
  setIsExpress,
}) => (
  <div className="space-y-4">
    {/* Input de Búsqueda */}
    <input
      type="text"
      placeholder="Buscar cliente…"
      value={clientSearch}
      onChange={(e) => setClientSearch(e.target.value)}
      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-indigo-600 bg-white dark:bg-slate-900 dark:text-slate-200 transition-all shadow-sm"
      spellCheck="false"
      autoComplete="off"
    />

    {/* Lista de Clientes */}
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
      {clients
        .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
        .map((c) => {
          const isSelected = selectedClient?.id_client === c.id_client;
          return (
            <button
              key={c.id_client}
              type="button"
              onClick={() => setSelectedClient(c)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm shadow-sm ${
                isSelected
                  ? 'bg-slate-800 dark:bg-indigo-600 text-white border-slate-800 dark:border-indigo-500'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{c.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-lg ${
                    isSelected
                      ? 'bg-slate-700 dark:bg-indigo-500 text-slate-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {c.client_type === 'family' ? '👨‍👩‍👧 Familiar' : '👤 Personal'}
                </span>
              </div>
            </button>
          );
        })}
    </div>

    {/* Toggle Pedido Express */}
    {selectedClient && !familyClient && (
      <button
        type="button"
        onClick={() => setIsExpress((p) => !p)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
          isExpress
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-400 shadow-inner'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <Zap
            size={18}
            className={isExpress ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}
          />
          <div className="text-left">
            <span className="block">Pedido Express</span>
            {isExpress && (
              <span className="text-[10px] opacity-70 block">Sin plantilla ni ruta fija</span>
            )}
          </div>
        </div>
        <div
          className={`flex flex-col items-end text-xs font-semibold ${isExpress ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400'}`}
        >
          <span>{isExpress ? 'Activo' : 'Entrega según ruta'}</span>
          <span className="text-[10px] font-normal opacity-80">
            {isExpress ? 'Entrega hoy' : ''}
          </span>
        </div>
      </button>
    )}
  </div>
);

export default StepClient;
