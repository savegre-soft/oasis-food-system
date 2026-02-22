import { motion } from "framer-motion"
import { Mail, ArrowLeft, Send, Leaf } from "lucide-react"

const ForgotPassword = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 p-6">
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">

          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <Leaf className="text-emerald-600" size={28} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            Recuperar contraseña
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Ingresa tu correo y te enviaremos un enlace
          </p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="text-sm text-gray-600">Correo electrónico</label>
            <div className="flex items-center mt-1 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition">
              <Mail className="text-gray-400 mr-2" size={18} />
              <input
                type="email"
                placeholder="correo@oasisfood.com"
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition shadow-md"
          >
            <Send size={18} />
            Enviar enlace
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button className="text-emerald-600 hover:underline flex items-center justify-center gap-1 text-sm mx-auto">
            <ArrowLeft size={16} />
            Volver al login
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Oasis Food Operativo
        </p>
      </motion.div>
    </div>
  )
}

export default ForgotPassword