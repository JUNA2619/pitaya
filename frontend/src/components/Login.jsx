import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function Login({ onLogin, irARegistro }) {
  const [correo, setCorreo] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)
  const [cargando, setCargando] = useState(false)

  const mostrarError = (msg) => {
    setError(msg)
    setShake(false)
    setTimeout(() => setShake(true), 10)
  }

  const handleLogin = async () => {
    setError("")
    if (!correo || !contrasena) {
      mostrarError("Por favor complete todos los campos para continuar.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(correo)) {
      mostrarError("El correo ingresado no tiene un formato válido.")
      return
    }
    setCargando(true)
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena })
      })
      const data = await res.json()
      if (!res.ok) {
        mostrarError(data.detail || "Correo o contraseña incorrectos. Verifique sus datos e intente de nuevo.")
      } else {
        localStorage.setItem("token", data.token)
        onLogin(data.usuario)
      }
    } catch {
      mostrarError("No se pudo conectar al servidor.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">PitaYa</h1>
      <p className="text-gray-500 text-sm mb-6">Inicia sesión para continuar</p>

      {error && (
        <div
          className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4"
          style={{ animation: shake ? "shake 0.4s ease" : "none" }}
        >
          {error}
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">
          Correo electrónico <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 ${!correo && error ? "border-red-400" : "border-gray-200"}`}
          placeholder="juan@ejemplo.com"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-1">
          Contraseña <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={contrasena}
          onChange={e => setContrasena(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 ${!contrasena && error ? "border-red-400" : "border-gray-200"}`}
          placeholder="••••••"
        />
      </div>

      <button
        onClick={handleLogin}
        disabled={cargando}
        className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
      >
        {cargando ? "Entrando..." : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        ¿No tienes cuenta?{" "}
        <button onClick={irARegistro} className="text-purple-600 hover:underline">Regístrate</button>
      </p>
    </div>
  )
}