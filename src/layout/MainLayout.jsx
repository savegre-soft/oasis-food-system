import { Outlet } from "react-router-dom"
import Navbar from "../components/NavBar"

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-300 flex flex-col">

      {/* Navbar Sticky */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 pt-20 pb-16">
        <Outlet />
      </main>

      {/* Footer Sticky */}
      <footer className="fixed bottom-0 left-0 w-full bg-green-800 text-center p-3 text-sm text-white z-50 shadow-md">
        © 2026 Oasis Food System. All rights reserved.
      </footer>

    </div>
  )
}