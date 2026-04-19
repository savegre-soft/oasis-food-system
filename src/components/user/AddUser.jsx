import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { sileo } from "sileo";

const AddUser = ({ onClose }) => {
  const { supabase } = useApp(); // Usando useApp como en tu referencia

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Crear usuario en Auth (Uso de signUp para evitar error de Bearer Token)
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2️⃣ Crear perfil en tabla profiles si el usuario se creó correctamente
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              name: formData.name,
            },
          ]);

        if (profileError) throw profileError;
      }
      sileo.success("Usuario registrado correctamente ");
   
      if (onClose) onClose();
    } catch (err) {
      sileo.error( {
        title: "Error al registrar usuario",
            message: err.message,
      } );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
        Agregar Nuevo Operador
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
            Nombre Completo
          </label>
          <input
            required
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white outline-none"
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
            Correo Electrónico
          </label>
          <input
            required
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white outline-none"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
            Contraseña (mín. 8 caracteres)
          </label>
          <input
            required
            name="password"
            type="password"
            minLength={8}
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white outline-none"
            placeholder="••••••••"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Registrando..." : "Registrar Usuario"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;