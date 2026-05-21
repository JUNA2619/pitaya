import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function Registro({ onRegistro, irALogin }) {
  const [form, setForm] = useState({
    nombre: "", correo: "", contrasena: "", confirmarContrasena: "", telefono: "", rol: "arbitro"
  })
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)
  const [camposVacios, setCamposVacios] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const mostrarError = (msg) => {
    setError(msg)
    setShake(false)
    setTimeout(() => setShake(true), 10)
  }

  const handleRegistro = async () => {
    setError("")
    setCamposVacios(false)

    if (!form.nombre || !form.correo || !form.contrasena || !form.confirmarContrasena || !form.telefono) {
      mostrarError("Por favor complete todos los campos obligatorios.")
      setCamposVacios(true)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.correo)) {
      mostrarError("El correo ingresado no es válido. Verifique el formato.")
      return
    }
    if (form.contrasena !== form.confirmarContrasena) {
      mostrarError("Las contraseñas no coinciden. Por favor verifíquelas.")
      return
    }
    if (form.contrasena.length < 8) {
      mostrarError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (form.contrasena.length > 20) {
      mostrarError("La contraseña no puede superar los 20 caracteres.")
      return
    }
    if (!/^\d+$/.test(form.telefono)) {
      mostrarError("El número de teléfono solo debe contener dígitos.")
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
      if (!res.ok) { mostrarError(data.detail || "Error al registrarse") }
      else {
        localStorage.setItem("token", data.token)
        onRegistro(data.usuario)
      }
    } catch { mostrarError("No se pudo conectar al servidor.") } finally { setCargando(false) }
  }

  const campoClass = (campo) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 ${camposVacios && !form[campo] ? "border-red-400" : "border-gray-200"}`

  return (
    <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">PitaYa</h1>
      <p className="text-gray-500 text-sm mb-6">Crea tu cuenta</p>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      {error && (
        <div
          className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4"
          style={{ animation: shake ? "shake 0.4s ease" : "none" }}
        >
          {error}
        </div>
      )}

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Nombre completo <span className="text-red-500">*</span></label>
        <input name="nombre" value={form.nombre} onChange={handleChange}
          className={campoClass("nombre")} placeholder="Tu nombre completo" />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Correo electrónico <span className="text-red-500">*</span></label>
        <input name="correo" type="email" value={form.correo} onChange={handleChange}
          className={campoClass("correo")} placeholder="juan@ejemplo.com" />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Contraseña <span className="text-red-500">*</span></label>
        <input name="contrasena" type="password" value={form.contrasena} onChange={handleChange}
          className={campoClass("contrasena")} placeholder="Mínimo 8 caracteres" />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Confirmar contraseña <span className="text-red-500">*</span></label>
        <input name="confirmarContrasena" type="password" value={form.confirmarContrasena} onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
            (camposVacios && !form.confirmarContrasena) || (form.confirmarContrasena && form.contrasena !== form.confirmarContrasena)
              ? "border-red-400 focus:border-red-400"
              : "border-gray-200 focus:border-purple-400"
          }`}
          placeholder="••••••" />
        {form.confirmarContrasena && form.contrasena !== form.confirmarContrasena && (
          <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden.</p>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Número de teléfono <span className="text-red-500">*</span></label>
        <input name="telefono" value={form.telefono} onChange={handleChange}
          className={campoClass("telefono")} placeholder="3001234567" />
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-1">Rol <span className="text-red-500">*</span></label>
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