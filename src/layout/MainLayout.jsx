import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-300 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        <Outlet />
      </main>

      <footer className="bg-green-800 text-center p-2 text-sm text-white">
        © 2026 Oasis Food System. All rights reserved.
      </footer>
    </div>
  )
}