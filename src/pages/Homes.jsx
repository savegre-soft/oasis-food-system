import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';

const Homes = () => {
  return (
    <div className="w-full">
      {/* HERO */}
      <section className="py-20 md:py-28 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-emerald-800 leading-tight"
        >
          Comida saludable, lista cada semana
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto"
        >
          Suscribite a un plan semanal con tus macros bajo control y recibí tu comida en la puerta de
          tu casa por ruta de entrega. Sin cocinar, sin complicarte — solo abrir y disfrutar.
        </motion.p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/menu"
            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:bg-emerald-700 hover:scale-105 transition"
          >
            Ver Menú
          </Link>

          <Link
            to="/promociones"
            className="border-2 border-emerald-600 text-emerald-700 px-8 py-3 rounded-2xl font-semibold hover:bg-emerald-50 transition"
          >
            Promociones
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Macros bajo control',
              desc: 'Cada plato se prepara con la proteína y el carbohidrato que necesitás, ajustados a tu plan.',
            },
            {
              title: 'Entrega por rutas',
              desc: 'Recibí tu pedido semanal en la puerta de tu casa, según la ruta y el día que te corresponde.',
            },
            {
              title: 'Suscripción semanal',
              desc: 'Armá tu menú una vez y recibí tu comida cada semana, sin tener que volver a pedir.',
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-xl transition"
            >
              <h3 className="text-xl font-semibold text-emerald-700 mb-4">{item.title}</h3>
              <p className="text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 text-center bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl text-white shadow-xl">
        <h2 className="text-3xl md:text-4xl font-bold">¿Listo para empezar tu plan?</h2>
        <p className="mt-4 text-emerald-100 max-w-xl mx-auto">
          Dejanos tus datos y armamos juntos tu suscripción semanal.
        </p>
        <Link
          to="/ordenar"
          className="inline-block mt-8 bg-white text-emerald-700 px-10 py-4 rounded-2xl font-semibold shadow-md hover:bg-emerald-50 hover:scale-105 transition"
        >
          Quiero ser cliente
        </Link>
      </section>
    </div>
  );
};

export default Homes;
