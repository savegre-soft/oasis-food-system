import { motion } from "framer-motion"
import { Mail, Lock, LogIn, Leaf } from "lucide-react"

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 p-6">
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center mb-4"
          >
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <Leaf className="text-emerald-600" size={28} />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-800">
            Oasis Food Operativo
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Accede a tu plataforma operativa
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          
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

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition shadow-md"
          >
            <LogIn size={18} />
            Iniciar Sesión
          </motion.button>

        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Oasis Food Operativo
        </p>
      </motion.div>
    </div>
  )
}

export default Login