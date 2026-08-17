// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import LeadForm from '../components/LeadForm';

// Antes simulaba un pedido real de restaurante (cliente/dirección/pago/total),
// sin relación al modelo real de suscripción semanal. El sitio público es
// marketing + captura de interesados — los pedidos reales viven en el portal
// de clientes (RF-PUB-04, docs/v2/02_REQUERIMIENTOS_SITIO_PUBLICO.md).
const Order = () => {
  return (
    <div className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-800">Quiero ser cliente</h1>
          <p className="mt-4 text-slate-600">
            Dejanos tu información y nuestro equipo te contacta para armar tu plan semanal.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white shadow-xl rounded-3xl p-8 md:p-12"
        >
          <LeadForm />
        </motion.div>
      </div>
    </div>
  );
};

export default Order;
