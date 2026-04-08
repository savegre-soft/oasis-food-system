import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, Leaf } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sileo } from 'sileo';
import { useApp } from '../context/AppContext';

const ForgotPassword = () => {
  const { supabase } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      sileo.error({
        title: 'Ingresa un correo',
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        sileo.error({
          title: 'Error',
          description: error.message,
        });
        return;
      }

      sileo.success({
        title: 'Correo enviado',
        description: 'Revisa tu correo para cambiar la contraseña',
      });
    } catch (err) {
      sileo.error({
        title: 'Error inesperado',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

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

          <h1 className="text-2xl font-bold text-gray-800">Recuperar contraseña</h1>

          <p className="text-gray-500 mt-2 text-sm">Ingresa tu correo y te enviaremos un enlace</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-gray-600">Correo electrónico</label>

            <div className="flex items-center mt-1 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 transition">
              <Mail className="text-gray-400 mr-2" size={18} />

              <input
                type="email"
                placeholder="correo@oasisfood.com"
                className="w-full outline-none text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition shadow-md disabled:opacity-60"
          >
            <Send size={18} />
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-emerald-600 hover:underline flex items-center justify-center gap-1 text-sm mx-auto"
          >
            <ArrowLeft size={16} />
            Volver al login
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 Oasis Food Operativo</p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
