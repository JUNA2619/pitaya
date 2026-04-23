import { useState } from "react"
import Login from "./components/Login"
import Registro from "./components/Registro"

export default function App() {
  const [pantalla, setPantalla] = useState("login")
  const [usuario, setUsuario] = useState(null)

  if (usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Bienvenido, {usuario.nombre}
          </h1>
          <p className="text-gray-500">Rol: {usuario.rol}</p>
          <button
            onClick={() => setUsuario(null)}
            className="mt-6 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {pantalla === "login" ? (
        <Login
          onLogin={setUsuario}
          irARegistro={() => setPantalla("registro")}
        />
      ) : (
        <Registro
          onRegistro={setUsuario}
          irALogin={() => setPantalla("login")}
        />
      )}
    </div>
  )
}