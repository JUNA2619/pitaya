import { useState } from "react"
import Login from "./components/Login"
import Registro from "./components/Registro"
import DashboardProgramador from "./components/DashboardProgramador"
import DashboardArbitro from "./components/DashboardArbitro"

export default function App() {
  const [pantalla, setPantalla] = useState("login")
  const [usuario, setUsuario] = useState(null)

  const handleLogin = (u) => setUsuario(u)
  const handleLogout = () => {
    localStorage.removeItem("token")
    setUsuario(null)
  }

  if (usuario?.rol === "programador") {
    return <DashboardProgramador usuario={usuario} onLogout={handleLogout} />
  }

  if (usuario?.rol === "arbitro") {
    return <DashboardArbitro usuario={usuario} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {pantalla === "login" ? (
        <Login onLogin={handleLogin} irARegistro={() => setPantalla("registro")} />
      ) : (
        <Registro onRegistro={handleLogin} irALogin={() => setPantalla("login")} />
      )}
    </div>
  )
}