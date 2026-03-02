import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, XCircle } from 'lucide-react'; // ícono de cerrar de lucide

/**
 * Componente Modal con animaciones usando framer-motion y fondo oscuro.
 *
 * @param {boolean} isOpen - Indica si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {React.ReactNode} children - Contenido dinámico dentro del modal
 */
export default function Modal({ isOpen, onClose, children }) {
  // Bloquea el scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo oscuro animado */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Contenedor del modal */}
          <motion.div
            className="fixed inset-0 z-50 flex justify-center items-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl p-6 relative w-full max-w-md shadow-xl">
              {/* Botón de cerrar usando Lucide */}
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                onClick={onClose}
              >
                <XCircle
                  size={24}
                  className="text-red-600 hover:rotate-180 hover:text-red-700 transition duration-500"
                />
              </button>

           <div className='p-2'>
               {/* Contenido dinámico */}
              {children}
           </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
