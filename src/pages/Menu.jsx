import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const dishes = [
  {
    id: 1,
    name: 'Bowl Tropical',
    description: 'Arroz integral, pollo a la plancha, aguacate y salsa especial.',
    price: '₡3200',
  },
  {
    id: 2,
    name: 'Wrap Verde Fresh',
    description: 'Tortilla integral rellena de vegetales frescos y proteína a elección.',
    price: '₡2800',
  },
  {
    id: 3,
    name: 'Ensalada Oasis',
    description: 'Mix de hojas verdes, frutas frescas y aderezo de la casa.',
    price: '₡3500',
  },
  {
    id: 4,
    name: 'Smoothie Energético',
    description: 'Banano, fresas, proteína natural y leche vegetal.',
    price: '₡4900',
  },
];

const Menu = () => {
  return (
    <div className="py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-800">Nuestro Menú</h1>
        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          Descubre nuestros platos frescos preparados al momento con ingredientes naturales y llenos
          de sabor.
        </p>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {dishes.map((dish, index) => (
          <motion.div
            key={dish.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-md hover:shadow-xl transition p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-semibold text-emerald-700 mb-2">{dish.name}</h3>
              <p className="text-slate-600 text-sm mb-4">{dish.description}</p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-lg font-bold text-emerald-800">{dish.price}</span>

              <Link
                to="/ordenar"
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 hover:scale-105 transition"
              >
                Ordenar
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">¿Listo para disfrutar?</h2>
        <p className="mt-3 text-slate-600">
          Haz tu pedido ahora y recibe tu comida fresca en minutos.
        </p>
        <Link
          to="/ordenar"
          className="inline-block mt-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition"
        >
          Ordenar Ahora
        </Link>
      </div>
    </div>
  );
};

export default Menu;
