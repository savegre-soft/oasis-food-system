import { motion } from "framer-motion"
import { Mail, Lock, LogIn, Leaf } from "lucide-react"
import { Link } from "react-router-dom"
import { sileo } from "sileo"
import { useNavigate } from "react-router-dom"

const Login = () => {
  const navigate = useNavigate();

  // 🔹 Función vacía para manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault()
  }

  // 🔹 Función vacía para email
  const handleEmailChange = (e) => {
  }

  // 🔹 Función vacía para contraseña
  const handlePasswordChange = (e) => {
  }

  // 🔹 Función vacía para botón login
  const handleLoginClick = () => {
    sileo.success({ title: "Changes saved" })
    navigate("/main")
  }

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
        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* Email */}
          <div>
            <label className="text-sm text-gray-600">Correo electrónico</label>
            <div className="flex items-center mt-1 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition">
              <Mail className="text-gray-400 mr-2" size={18} />
              <input
                type="email"
                placeholder="correo@oasisfood.com"
                className="w-full outline-none text-sm"
                onChange={handleEmailChange}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-600">Contraseña</label>
              <Link
                to="/forgot-password"
                className="text-xs text-emerald-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="flex items-center mt-1 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition">
              <Lock className="text-gray-400 mr-2" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full outline-none text-sm"
                onChange={handlePasswordChange}
              />
            </div>
          </div>

          {/* Button */}
          <motion.button
            type="submit"
            onClick={handleLoginClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition shadow-md"
          >
            <LogIn size={18} />
            Iniciar Sesión
          </motion.button>

        </form>

        {/* Registro */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Crear cuenta
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Oasis Food Operativo
        </p>
      </motion.div>
    </div>
  )
}

export default Login