import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Shield, Calendar, Mail } from 'lucide-react';
import { sileo } from 'sileo';

import { useApp } from '../context/AppContext';

// ── Password strength ─────────────────────────────────────────────────────────

function getStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { level: 1, label: 'Muy débil', color: 'bg-red-500' },
    { level: 2, label: 'Débil', color: 'bg-orange-400' },
    { level: 3, label: 'Moderada', color: 'bg-amber-400' },
    { level: 4, label: 'Fuerte', color: 'bg-emerald-500' },
  ];
  return map[score - 1] ?? { level: 0, label: '', color: '' };
}

const StrengthBar = ({ password }) => {
  const { level, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= level ? color : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
};

// ── Password input ────────────────────────────────────────────────────────────

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-4 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { supabase, user } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-CR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('es-CR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      sileo.error({ title: 'Completa todos los campos' });
      return;
    }

    if (newPassword.length < 6) {
      sileo.error({ title: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (newPassword !== confirmPassword) {
      sileo.error({ title: 'Las contraseñas no coinciden' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        sileo.error({ title: 'Error al actualizar', description: error.message });
        return;
      }

      sileo.success({ title: 'Contraseña actualizada correctamente' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      sileo.error({ title: 'Error inesperado', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Mi Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Información de tu cuenta y configuración de seguridad</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Info card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-1"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <User size={36} className="text-slate-400 dark:text-slate-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 break-all">{user?.email}</h2>
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                <Shield size={11} />
                Cuenta activa
              </span>
            </div>

            {/* Details */}
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-700 pt-5">
              <div className="flex items-start gap-3">
                <Mail size={15} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Correo electrónico</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 break-all">{user?.email ?? '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={15} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Miembro desde</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{memberSince}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock size={15} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Último acceso</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{lastSignIn}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Change password ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                <Lock size={18} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Cambiar contraseña</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Usa al menos 6 caracteres con números y mayúsculas</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nueva contraseña
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <StrengthBar password={newPassword} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmar contraseña
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">Las contraseñas no coinciden</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">Las contraseñas coinciden</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-700 dark:hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock size={15} />
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
