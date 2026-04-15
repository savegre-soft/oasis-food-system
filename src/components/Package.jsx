import { useState, useRef, useEffect, useCallback } from 'react';
import { Truck, Archive, AlertTriangle, CheckCircle, GripVertical, ClipboardCopy, ClipboardCheck } from 'lucide-react';

// ── Group order_days by client ────────────────────────────────────────────────

const groupByClient = (orderDays) => {
  const clients = {};
  for (const od of orderDays) {
    const clientId = od.orders?.clients?.id_client ?? od.orders?.clients?.name ?? '_';
    const clientName = od.orders?.clients?.name ?? '(sin nombre)';
    if (!clients[clientId]) clients[clientId] = { id: clientId, name: clientName, orderDays: [] };
    clients[clientId].orderDays.push({
      id_order_day: od.id_order_day,
      status: od.status,
      classification: od.orders?.classification,
      recipes: (od.order_day_details ?? []).map((d) => ({
        name: d.recipes?.name ?? '(sin nombre)',
        quantity: d.quantity ?? 1,
      })),
    });
  }
  return clients;
};

// ── ClassificationBadge ───────────────────────────────────────────────────────

const ClassificationBadge = ({ classification }) => {
  if (classification === 'Lunch')
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
        ☀️ Almuerzo
      </span>
    );
  if (classification === 'Dinner')
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
        🌙 Cena
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">
      👨‍👩‍👧 Familiar
    </span>
  );
};

// ── ClientEmpaqueCard ─────────────────────────────────────────────────────────

const ClientEmpaqueCard = ({ client, onDeliver, isDragging }) => {
  const packed = client.orderDays.filter((od) => od.status === 'PACKED');
  const pending = client.orderDays.filter((od) => od.status === 'PENDING');
  const allPackedIds = packed.map((od) => od.id_order_day);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        isDragging
          ? 'border-orange-300 shadow-md opacity-60 scale-[0.98]'
          : 'border-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Drag handle — visual only, drag is on the wrapper */}
          <div
            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 transition shrink-0"
            title="Arrastrar para reordenar"
          >
            <GripVertical size={18} />
          </div>

          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{client.name}</p>
            <p className="text-xs text-slate-400">
              {packed.length} empacado{packed.length !== 1 ? 's' : ''}
              {pending.length > 0 && (
                <span className="text-amber-600 ml-1">· {pending.length} sin empacar</span>
              )}
            </p>
          </div>
        </div>

        {packed.length > 0 && (
          <button
            type="button"
            onClick={() => allPackedIds.forEach((id) => onDeliver(id))}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition shrink-0"
          >
            <Truck size={13} />
            Entregar todo
          </button>
        )}
      </div>

      {/* Aviso si tiene pendientes sin empacar */}
      {pending.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-b border-amber-100">
          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            {pending.length} comida{pending.length !== 1 ? 's' : ''} aún sin empacar
          </p>
        </div>
      )}

      {/* Packed items — with Deliver action */}
      {packed.length > 0 && (
        <div className="divide-y divide-slate-50">
          {packed.map((od) => (
            <div key={od.id_order_day} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <ClassificationBadge classification={od.classification} />
                {(od.recipes ?? []).map((r, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                  >
                    {r.name}
                    {r.quantity > 1 ? ` ×${r.quantity}` : ''}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onDeliver(od.id_order_day)}
                className="flex items-center gap-1.5 text-xs text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl transition shrink-0 ml-3"
              >
                <Truck size={12} />
                Entregar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending items — informational only */}
      {pending.length > 0 && (
        <div className="divide-y divide-slate-50">
          {pending.map((od) => (
            <div key={od.id_order_day} className="flex items-center gap-2 px-5 py-3 opacity-50">
              <Archive size={12} className="text-slate-400 shrink-0" />
              <ClassificationBadge classification={od.classification} />
              {(od.recipes ?? []).map((r, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {r.name}
                  {r.quantity > 1 ? ` ×${r.quantity}` : ''}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── EmpaqueView ───────────────────────────────────────────────────────────────

const EmpaqueView = ({ pendingDays, packedDays, onDeliver }) => {
  const allDays = [...(pendingDays ?? []), ...(packedDays ?? [])];
  const byClient = groupByClient(allDays);

  // Ordered list of client IDs — allows manual reordering
  const [order, setOrder] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  // Use a ref so drag callbacks always see the current dragging index
  const draggingIndexRef = useRef(null);

  // Sync order when client list changes (keeps existing order, appends new clients)
  useEffect(() => {
    const incoming = Object.values(byClient)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => c.id);

    setOrder((prev) => {
      const kept = prev.filter((id) => byClient[id]);
      const added = incoming.filter((id) => !kept.includes(id));
      return [...kept, ...added];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDays, packedDays]);

  const clients = order.map((id) => byClient[id]).filter(Boolean);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((index) => {
    draggingIndexRef.current = index;
    setDraggingIndex(index);
  }, []);

  const handleDragEnter = useCallback((toIndex) => {
    const fromIndex = draggingIndexRef.current;
    if (fromIndex === null || fromIndex === toIndex) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    draggingIndexRef.current = toIndex;
    setDraggingIndex(toIndex);
  }, []);

  const handleDragEnd = useCallback(() => {
    draggingIndexRef.current = null;
    setDraggingIndex(null);
  }, []);

  // ── Copy list ─────────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const text = clients.map((c) => c.name).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [clients]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <CheckCircle size={36} className="mx-auto mb-3 opacity-30" />
        <p>No hay pedidos activos para empacar</p>
      </div>
    );
  }

  const packedCount = clients.reduce(
    (s, c) => s + c.orderDays.filter((od) => od.status === 'PACKED').length,
    0
  );
  const pendingCount = clients.reduce(
    (s, c) => s + c.orderDays.filter((od) => od.status === 'PENDING').length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Summary row + Copy button */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {packedCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-green-500" /> {packedCount} empacado
              {packedCount !== 1 ? 's' : ''}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Archive size={14} className="text-amber-400" /> {pendingCount} sin empacar
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition shrink-0 ${
            copied
              ? 'text-green-700 bg-green-50 border-green-200'
              : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          {copied ? <ClipboardCheck size={13} /> : <ClipboardCopy size={13} />}
          {copied ? 'Copiado' : 'Copiar lista'}
        </button>
      </div>

      {clients.map((client, index) => (
        <div
          key={client.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
        >
          <ClientEmpaqueCard
            client={client}
            onDeliver={onDeliver}
            isDragging={draggingIndex === index}
          />
        </div>
      ))}
    </div>
  );
};

export default EmpaqueView;
