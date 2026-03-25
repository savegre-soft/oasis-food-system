import { Outlet } from 'react-router-dom';
import PublicNavBar from '../components/PublicNavBar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 text-slate-800">
      <PublicNavBar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-10">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Contenido */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Marca */}
            <div className="text-center md:text-left">
              <p className="text-lg font-semibold tracking-wide">Oasis Food</p>
              <p className="text-emerald-100 text-sm mt-1">Sabor fresco todos los días 🌿</p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-emerald-100">
              <a className="hover:text-white transition">Inicio</a>
              <a className="hover:text-white transition">Menú</a>
              <a className="hover:text-white transition">Contacto</a>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 my-5" />

          {/* Copyright */}
          <div className="text-center text-xs text-emerald-100">
            © {new Date().getFullYear()} Oasis Food · Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
