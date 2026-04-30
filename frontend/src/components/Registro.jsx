import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function Registro({ onRegistro, irALogin }) {
  const [form, setForm] = useState({
    nombre: "", correo: "", contrasena: "", confirmarContrasena: "", telefono: "", rol: "arbitro"
  })
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegistro = async () => {
    setError("")
    console.log("ROL ENVIADO:", form.rol)
    if (form.contrasena !== form.confirmarContrasena) {
      setError("Las contraseñas no coinciden. Por favor verifíquelas.")
      return
    }
    setCargando(true)
    try {
      const { confirmarContrasena, ...datosEnvio } = form
      const res = await fetch(`${API}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEnvio)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || "Error al registrarse") }
      else {
        console.log("USUARIO RECIBIDO:", data.usuario)
        localStorage.setItem("token", data.token)
        onRegistro(data.usuario)
      }
    } catch { setError("No se pudo conectar al servidor") } finally { setCargando(false) }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">PitaYa</h1>
      <p className="text-gray-500 text-sm mb-6">Crea tu cuenta</p>
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Nombre</label>
        <input name="nombre" value={form.nombre} onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="Tu nombre" />
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Correo</label>
        <input name="correo" type="email" value={form.correo} onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="juan@ejemplo.com" />
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
        <input name="contrasena" type="password" value={form.contrasena} onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="••••••" />
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Confirmar contraseña</label>
        <input name="confirmarContrasena" type="password" value={form.confirmarContrasena} onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${form.confirmarContrasena && form.contrasena !== form.confirmarContrasena ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-purple-400"}`}
          placeholder="••••••" />
        {form.confirmarContrasena && form.contrasena !== form.confirmarContrasena && (
          <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden.</p>
        )}
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
        <input name="telefono" value={form.telefono} onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="3001234567" />
      </div>
      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-1">Rol</label>
        <select name="rol" value={form.rol} onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
          <option value="arbitro">Árbitro</option>
          <option value="programador">Coordinador</option>
        </select>
      </div>
      <button onClick={handleRegistro} disabled={cargando}
        className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
        {cargando ? "Registrando..." : "Crear cuenta"}
      </button>
      <p className="text-center text-sm text-gray-500 mt-4">¿Ya tienes cuenta?{" "}
        <button onClick={irALogin} className="text-purple-600 hover:underline">Inicia sesión</button>
      </p>
    </div>
  )
}