import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const promos = [
  {
    id: 1,
    title: "Combo Almuerzo Oasis",
    description: "Plato fuerte + bebida natural + postre pequeño.",
    price: "₡4,500",
    badge: "Más vendido",
  },
  {
    id: 2,
    title: "Promo Pareja",
    description: "2 bowls + 2 bebidas a precio especial.",
    price: "₡8,900",
    badge: "Ahorra ₡1,000",
  },
  {
    id: 3,
    title: "Combo Saludable",
    description: "Ensalada + smoothie energético.",
    price: "₡3,800",
    badge: "Nuevo",
  },
];

const Promotions = () => {
  return (
    <div className="py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-800">
          Promociones Especiales
        </h1>
        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          Aprovecha nuestras ofertas exclusivas y disfruta más sabor por menos precio.
        </p>
      </div>

      {/* Promo Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {promos.map((promo, index) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-3xl shadow-md hover:shadow-xl transition p-8 flex flex-col justify-between"
          >
            {/* Badge */}
            <span className="absolute top-4 right-4 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full shadow">
              {promo.badge}
            </span>

            <div>
              <h3 className="text-xl font-semibold text-emerald-700 mb-3">
                {promo.title}
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                {promo.description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-2xl font-bold text-emerald-800">
                {promo.price}
              </span>

              <Link
                to="/ordenar"
                className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-700 hover:scale-105 transition"
              >
                Ordenar
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">
          ¡No dejes pasar estas ofertas!
        </h2>
        <p className="mt-3 text-slate-600">
          Promociones válidas por tiempo limitado.
        </p>
        <Link
          to="/menu"
          className="inline-block mt-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition"
        >
          Ver Menú Completo
        </Link>
      </div>
    </div>
  );
};

export default Promotions;