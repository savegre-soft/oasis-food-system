import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import Home from "./pages/Homes"
import About from "./pages/About"

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white">

        {/* Navbar */}
        <nav className="p-4 bg-slate-800 flex gap-4">
          <Link to="/" className="hover:text-cyan-400">Home</Link>
          <Link to="/about" className="hover:text-cyan-400">About</Link>
        </nav>

        {/* Routes */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  )
}