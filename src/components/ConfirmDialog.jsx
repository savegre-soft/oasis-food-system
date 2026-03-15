import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

// Reusable confirmation dialog
// Usage: <ConfirmDialog open={!!toDelete} title="¿Eliminar ruta?" message="Esta acción no se puede deshacer."
//          onConfirm={() => { doDelete(toDelete); setToDelete(null); }} onCancel={() => setToDelete(null)} />
const ConfirmDialog = ({ open, title = '¿Confirmar acción?', message, onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-3 bg-red-50 rounded-2xl">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-lg">{title}</p>
              {message && <p className="text-sm text-slate-500 mt-1">{message}</p>}
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
