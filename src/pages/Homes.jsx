import { Link } from "react-router-dom";
import { motion } from "framer-motion";

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
          Bienvenido a Oasis Food
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto"
        >
          Disfruta comida fresca, saludable y preparada al momento.
          Calidad, sabor y rapidez en cada pedido.
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
              title: "Ingredientes Frescos",
              desc: "Seleccionamos productos naturales y de alta calidad cada día.",
            },
            {
              title: "Entrega Rápida",
              desc: "Preparamos y enviamos tu pedido en tiempo récord.",
            },
            {
              title: "Pedidos Online",
              desc: "Ordena fácilmente desde tu celular o computadora.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-xl transition"
            >
              <h3 className="text-xl font-semibold text-emerald-700 mb-4">
                {item.title}
              </h3>
              <p className="text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 text-center bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl text-white shadow-xl">
        <h2 className="text-3xl md:text-4xl font-bold">
          ¿Listo para ordenar?
        </h2>
        <p className="mt-4 text-emerald-100 max-w-xl mx-auto">
          Haz tu pedido ahora y disfruta el mejor sabor fresco en minutos.
        </p>
        <Link
          to="/ordenar"
          className="inline-block mt-8 bg-white text-emerald-700 px-10 py-4 rounded-2xl font-semibold shadow-md hover:bg-emerald-50 hover:scale-105 transition"
        >
          Ordenar Ahora
        </Link>
      </section>
    </div>
  );
};

export default Homes;