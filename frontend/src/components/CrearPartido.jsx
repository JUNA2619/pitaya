import { useState } from "react"

const API = import.meta.env.VITE_API_URL

export default function CrearPartido({ onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    fecha: "", hora: "", cancha: "", torneo: "", equipos: "",
    tipo: "futbol", num_periodos: 2, tiempo_periodo: 20, tipo_pago: "en_cancha"
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const guardar = async () => {
    if (!form.fecha || !form.hora) { setError("Fecha y hora son obligatorias"); return }
    setCargando(true); setError(null)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/partidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-screen overflow-y-auto">
        <h3 className="font-semibold text-gray-800 mb-4">Agregar partido</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fecha *</label>
            <input type="date" name="fecha" value={form.fecha} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Hora *</label>
            <input type="time" name="hora" value={form.hora} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Cancha</label>
          <input name="cancha" value={form.cancha} onChange={handleChange} placeholder="Ej: Cancha Norte"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Torneo</label>
          <input name="torneo" value={form.torneo} onChange={handleChange} placeholder="Ej: Copa Élite"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Equipos</label>
          <input name="equipos" value={form.equipos} onChange={handleChange} placeholder="Ej: Deportivo FC vs Atlético Sur"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400">
              <option value="futbol">Fútbol</option>
              <option value="futbol_sala">Fútbol sala</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Pago</label>
            <select name="tipo_pago" value={form.tipo_pago} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400">
              <option value="en_cancha">En cancha</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Periodos</label>
            <input type="number" name="num_periodos" value={form.num_periodos} onChange={handleChange} min={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Min por periodo</label>
            <input type="number" name="tiempo_periodo" value={form.tiempo_periodo} onChange={handleChange} min={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onCancelar}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={guardar} disabled={cargando}
            className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
            {cargando ? "Guardando..." : "Guardar partido"}
          </button>
        </div>
      </div>
    </div>
  )
}