import { Outlet } from "react-router-dom"

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 p-4">
        <h1 className="text-xl font-bold">Mi Sitio Público</h1>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}