import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Offcanvas({ isOpen, onClose, children, position = "right" }) {
  // Bloquear scroll cuando está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);

  // Determinar la animación según la posición
  const variants = {
    hidden: position === "right" ? { x: "100%" } : { x: "-100%" },
    visible: { x: 0 },
    exit: position === "right" ? { x: "100%" } : { x: "-100%" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo semi-transparente */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Panel Offcanvas */}
          <motion.div
            className={`fixed top-0 ${position}-0 h-full w-full max-w-sm bg-white shadow-xl z-50`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <div className="p-6 relative h-full flex flex-col">
              {/* Botón de cerrar */}
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                onClick={onClose}
              >
                <X size={20} />
              </button>

              {/* Contenido dinámico */}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}