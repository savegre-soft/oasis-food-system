import { BrowserRouter, Routes, Route } from "react-router-dom"
import MainLayout from "./layout/MainLayout"
import Home from "./pages/Homes"
import About from "./pages/About"
import Test from "./pages/Test"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/Pedidos" element={<Test />} />
           <Route path="/*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}