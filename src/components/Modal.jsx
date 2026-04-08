import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from 'lucide-react';

export default function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Contenedor */}
          <motion.div
            className="fixed inset-0 z-50 flex justify-center items-center p-4"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25 }}
          >
            <div className="bg-white rounded-3xl p-6 w-full max-w-5xl shadow-2xl relative overflow-y-auto max-h-[90vh]">
              {/* Botón cerrar */}
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition transform hover:rotate-90"
                onClick={onClose}
              >
                <XCircle size={30} />
              </button>

              {/* Contenido */}
              <div className="mt-4">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
