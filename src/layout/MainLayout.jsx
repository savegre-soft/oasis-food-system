import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import { useApp } from '../context/AppContext';

export default function MainLayout() {
  const { user, loading } = useApp();

  // Esperar mientras Supabase verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  // Si no hay usuario → enviar al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-300 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Contenido */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-2 pt-6 pb-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-green-800 text-center p-3 text-sm text-white z-50 shadow-md">
        © 2026 Oasis Food System. All rights reserved.
      </footer>
    </div>
  );
}
