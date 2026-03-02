import { motion } from 'framer-motion';

const Contact = () => {
  return (
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-800">Contáctanos</h1>
          <p className="mt-4 text-slate-600">
            ¿Tienes preguntas, sugerencias o quieres hacer un pedido especial? Escríbenos y te
            responderemos lo antes posible.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white shadow-xl rounded-3xl p-8 md:p-12"
        >
          <form className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
              <input
                type="text"
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="correo@email.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mensaje</label>
              <textarea
                rows="5"
                placeholder="Escribe tu mensaje aquí..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
              />
            </div>

            <button
              type="submit"
              className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition"
            >
              Enviar Mensaje
            </button>
          </form>
        </motion.div>

        {/* Extra Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-emerald-50 rounded-2xl p-6">
            <h3 className="font-semibold text-emerald-700 mb-2">📍 Ubicación</h3>
            <p className="text-sm text-slate-600">San José, Costa Rica</p>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-6">
            <h3 className="font-semibold text-emerald-700 mb-2">📞 Teléfono</h3>
            <p className="text-sm text-slate-600">+506 8888-8888</p>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-6">
            <h3 className="font-semibold text-emerald-700 mb-2">⏰ Horario</h3>
            <p className="text-sm text-slate-600">Lunes a Domingo 10:00am - 9:00pm</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
