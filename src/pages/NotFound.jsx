import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-teal-400/20 rounded-full blur-3xl -bottom-20 -right-20" />

      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-7xl md:text-9xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent"
      >
        404
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-6 text-2xl md:text-3xl font-semibold text-slate-700"
      >
        Ups… esta página se perdió en el desierto 🏜️
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="mt-4 text-slate-500 max-w-md"
      >
        Parece que la ruta que buscas no existe o fue movida. Pero no te preocupes, tenemos mucha
        comida deliciosa esperándote.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="mt-8 flex flex-col sm:flex-row gap-4"
      >
        <Link
          to="/"
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:bg-emerald-700 hover:scale-105 transition"
        >
          Volver al Inicio
        </Link>

        <Link
          to="/menu"
          className="border-2 border-emerald-600 text-emerald-700 px-8 py-3 rounded-2xl font-semibold hover:bg-emerald-50 transition"
        >
          Ver Menú
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
