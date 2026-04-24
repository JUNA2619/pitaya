import { useState } from "react"

const API = import.meta.env.VITE_API_URL

export default function Registro({ onRegistro, irALogin }) {
  const [form, setForm] = useState({ nombre: "", correo: "", contrasena: "", telefono: "", rol: "arbitro", codigo_escuela: "" })
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegistro = async () => {
    setError(""); setCargando(true)
    try {
      const res = await fetch(`${API}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || "Error al registrarse") }
      else { localStorage.setItem("token", data.token); onRegistro(data.usuario) }
    } catch { setError("No se pudo conectar al servidor") } finally { setCargando(false) }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">PitaYa</h1>
      <p className="text-gray-500 text-sm mb-6">Crea tu cuenta</p>
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Nombre</label>
        <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="Tu nombre" />
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Correo</label>
        <input name="correo" type="email" value={form.correo} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="juan@ejemplo.com" />
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
        <input name="contrasena" type="password" value={form.contrasena} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="••••••" />
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
        <input name="telefono" value={form.telefono} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="3001234567" />
      </div>
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Rol</label>
        <select name="rol" value={form.rol} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
          <option value="arbitro">Árbitro</option>
          <option value="programador">Programador</option>
        </select>
      </div>
      {form.rol === "arbitro" && (
        <div className="mb-3">
          <label className="block text-sm text-gray-600 mb-1">Código de escuela</label>
          <input name="codigo_escuela" value={form.codigo_escuela} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="Ej: ARB-X7K2" />
        </div>
      )}
      <button onClick={handleRegistro} disabled={cargando} className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium mt-3 hover:bg-purple-700 disabled:opacity-50">
        {cargando ? "Registrando..." : "Crear cuenta"}
      </button>
      <p className="text-center text-sm text-gray-500 mt-4">¿Ya tienes cuenta?{" "}
        <button onClick={irALogin} className="text-purple-600 hover:underline">Inicia sesión</button>
      </p>
    </div>
  )
}