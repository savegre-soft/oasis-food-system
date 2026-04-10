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
    <input
      type="text"
      placeholder="Buscar cliente…"
      value={clientSearch}
      onChange={(e) => setClientSearch(e.target.value)}
      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
      spellCheck="false"
      autoComplete="off"
    />
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {clients
        .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
        .map((c) => (
          <button
            key={c.id_client}
            type="button"
            onClick={() => setSelectedClient(c)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${
              selectedClient?.id_client === c.id_client
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
            }`}
          >
            <span className="font-medium">{c.name}</span>
            <span
              className={`ml-2 text-xs ${
                selectedClient?.id_client === c.id_client ? 'text-slate-300' : 'text-slate-400'
              }`}
            >
              {c.client_type === 'family' ? '👨‍👩‍👧 Familiar' : '👤 Personal'}
            </span>
          </button>
        ))}
    </div>

    {selectedClient && !familyClient && (
      <button
        type="button"
        onClick={() => setIsExpress((p) => !p)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition text-sm font-medium ${
          isExpress
            ? 'bg-amber-50 border-amber-400 text-amber-800'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className={isExpress ? 'text-amber-500' : 'text-slate-400'} />
          <span>Pedido Express</span>
        </div>
        <div className={`flex flex-col items-end text-xs ${isExpress ? 'text-amber-600' : 'text-slate-400'}`}>
          <span>{isExpress ? 'Activo — entrega hoy' : 'Entrega según ruta'}</span>
          {isExpress && <span className="text-[10px] opacity-70">Sin plantilla ni ruta fija</span>}
        </div>
      </button>
    )}
  </div>
);

export default StepClient;
