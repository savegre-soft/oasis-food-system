import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { sileo } from "sileo";

const ChangePassword = () => {

  const { supabase } = useApp();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);

  useEffect(() => {

    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.replace("#", ""));

      const error = params.get("error");
      const description = params.get("error_description");

      if (error) {
        const message = decodeURIComponent(description || "Error en el enlace");

        setUrlError(message);

        sileo.error({
          title: "Link inválido",
          description: message
        });
      }
    }

  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!password || !confirm) {
      sileo.error({ title: "Completa los campos" });
      return;
    }

    if (password !== confirm) {
      sileo.error({ title: "Las contraseñas no coinciden" });
      return;
    }

    try {

      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        sileo.error({
          title: "Error",
          description: error.message
        });
        return;
      }

      sileo.success({
        title: "Contraseña actualizada"
      });

      navigate("/login");

    } catch (err) {

      sileo.error({
        title: "Error inesperado",
        description: err.message
      });

    } finally {
      setLoading(false);
    }
  };

  if (urlError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-800 p-6">
        <div className="bg-white rounded-xl p-6 text-center max-w-md">
          <h2 className="text-lg font-bold mb-2">Link inválido</h2>
          <p className="text-gray-600 mb-4">{urlError}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-green-700 text-white px-4 py-2 rounded"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-800 p-6">

      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-8">

        <h2 className="text-xl font-bold text-center mb-6">
          Cambiar contraseña
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">

          <input
            type="password"
            placeholder="Nueva contraseña"
            className="w-full border rounded-lg p-3"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            className="w-full border rounded-lg p-3"
            value={confirm}
            onChange={(e)=>setConfirm(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg"
          >
            {loading ? "Actualizando..." : "Cambiar contraseña"}
          </button>

        </form>

      </div>

    </div>
  );
};

export default ChangePassword;