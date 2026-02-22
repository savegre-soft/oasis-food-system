import { BrowserRouter, Routes, Route } from "react-router-dom"
import MainLayout from "./layout/MainLayout"
import Home from "./pages/Homes"
import About from "./pages/About"
import Test from "./pages/Test"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import ForgotPassword from "./pages/ForgotPassword"
import Register from "./pages/Register"
import { sileo, Toaster } from "sileo";

export default function App() {
  return (
    <>
   <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/Pedidos" element={<Test />} />
           <Route path="/*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="top-right" className="z-50" />
 
    </>
  )
}