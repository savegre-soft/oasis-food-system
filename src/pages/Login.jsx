// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { sileo } from 'sileo';
import { useApp } from '../context/AppContext';
import LogoUrl from '../assets/Oasis-logo.png';
import { WHATSAPP_LINK } from '../lib/siteContent';

const Login = () => {
  const navigate = useNavigate();
  const { supabase, user, loading: sessionLoading } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔹 Si ya hay sesión iniciada, redirigir
  useEffect(() => {
    if (!sessionLoading && user) {
      navigate('/main');
    }
  }, [user, sessionLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      sileo.error({
        title: 'Campos incompletos',
        description: 'Debes ingresar correo y contraseña',
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        sileo.error({
          title: 'Credenciales inválidas',
          description: 'Correo o contraseña incorrectos',
        });
        return;
      }

      sileo.success({
        title: 'Bienvenido',
        description: 'Inicio de sesión correcto',
      });

      navigate('/main');
    } catch {
      sileo.error({
        title: 'Error inesperado',
        description: 'Ocurrió un error. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-oasis-cream">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex flex-col justify-between bg-oasis-olive-700 text-white p-12 relative overflow-hidden">
        <span className="font-display italic text-9xl text-white/10 absolute -top-6 -left-4 select-none">
          Oa
        </span>
        <span className="font-display italic text-9xl text-white/10 absolute bottom-10 right-0 select-none">
          sis
        </span>

        <Link to="/" className="flex items-center gap-3 relative">
          <img src={LogoUrl} className="w-10 h-10 rounded-full object-cover bg-white" alt="Oasis" />
          <span className="font-display font-semibold text-xl">Oasis</span>
        </Link>

        <div className="relative">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Una semana organizada se siente más ligera.
          </h1>
          <p className="mt-4 text-oasis-olive-200 max-w-sm">
            Entrá a tu cuenta para ver tus pedidos y repetir tus favoritos.
          </p>
        </div>

        <p className="text-xs text-oasis-olive-300 relative">© {new Date().getFullYear()} Oasis</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <img src={LogoUrl} className="w-16 h-16 rounded-full object-cover" alt="Oasis" />
          </div>

          <h2 className="font-display text-3xl font-semibold text-oasis-ink">
            Bienvenido de vuelta
          </h2>
          <p className="text-oasis-ink/60 mt-2 text-sm">Ingresá con tu correo y contraseña.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-oasis-ink/70">Correo electrónico</label>
              <div className="flex items-center mt-2 border border-oasis-olive-200 rounded-xl px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-oasis-olive-500 transition">
                <Mail className="text-oasis-ink/30 mr-2" size={18} />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  className="w-full outline-none text-sm bg-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-oasis-ink/70">Contraseña</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-oasis-olive-600 hover:underline"
                >
                  ¿La olvidaste?
                </Link>
              </div>

              <div className="flex items-center mt-2 border border-oasis-olive-200 rounded-xl px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-oasis-olive-500 transition">
                <Lock className="text-oasis-ink/30 mr-2" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full outline-none text-sm bg-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="ml-2 text-oasis-ink/40 hover:text-oasis-ink/70 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-oasis-olive-600 hover:bg-oasis-olive-700 text-white py-3.5 rounded-full flex items-center justify-center gap-2 font-semibold transition shadow-sm disabled:opacity-60"
            >
              <LogIn size={18} />
              {loading ? 'Ingresando...' : 'Ingresar'}
            </motion.button>
          </form>

          <div className="flex items-center gap-4 my-7">
            <span className="h-px bg-oasis-olive-200 flex-1" />
            <span className="text-xs text-oasis-ink/40">o</span>
            <span className="h-px bg-oasis-olive-200 flex-1" />
          </div>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="block text-center border-2 border-oasis-olive-600 text-oasis-olive-700 py-3 rounded-full font-semibold hover:bg-oasis-olive-50 transition"
          >
            Pedir por WhatsApp sin cuenta
          </a>

          <p className="text-center text-sm text-oasis-ink/60 mt-6">
            ¿Aún no sos cliente?{' '}
            <Link to="/ordenar" className="text-oasis-olive-700 font-semibold hover:underline">
              Quiero ser cliente
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
