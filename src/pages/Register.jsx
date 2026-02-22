import { motion } from "framer-motion"
import { User, Mail, Lock, UserPlus, Leaf } from "lucide-react"

const Register = () => {
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
            Crear cuenta
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Regístrate en Oasis Food Operativo
          </p>
        </div>

        <form className="space-y-4">

          {/* Nombre */}
          <div>
            <label className="text-sm text-gray-600">Nombre completo</label>
            <div className="flex items-center mt-1 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition">
              <User className="text-gray-400 mr-2" size={18} />
              <input
                type="text"
                placeholder="Juan Pérez"
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="text-sm text-gray-600">Contraseña</label>
            <div className="flex items-center mt-1 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition">
              <Lock className="text-gray-400 mr-2" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition shadow-md"
          >
            <UserPlus size={18} />
            Crear cuenta
          </motion.button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Oasis Food Operativo
        </p>
      </motion.div>
    </div>
  )
}

export default Register