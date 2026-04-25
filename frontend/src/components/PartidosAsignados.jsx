import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function PartidosAsignados({ onVolver }) {
  const [asignaciones, setAsignaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cancelando, setCancelando] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/asignaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAsignaciones(await res.json())
    } catch {
      console.error("Error cargando asignaciones")
    } finally {
      setCargando(false)
    }
  }

  const cancelar = async (id) => {
    if (!confirm("¿Cancelar esta asignación?")) return
    setCancelando(id)
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API}/asignaciones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      cargar()
    } catch {
      console.error("Error cancelando")
    } finally {
      setCancelando(null)
    }
  }

  const estadoColor = (estado) => {
    if (estado === "confirmado") return "bg-green-50 text-green-700"
    if (estado === "rechazado") return "bg-red-50 text-red-700"
    return "bg-yellow-50 text-yellow-700"
  }

  const estadoTexto = (estado) => {
    if (estado === "confirmado") return "Confirmado"
    if (estado === "rechazado") return "Rechazado"
    return "Pendiente"
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onVolver} className="text-sm text-gray-500 hover:text-gray-700">← Volver</button>
        <h2 className="text-base font-semibold text-gray-800">Partidos asignados</h2>
      </div>

      {cargando && <p className="text-sm text-gray-400">Cargando...</p>}
      {!cargando && asignaciones.length === 0 && <p className="text-sm text-gray-400">No hay partidos asignados.</p>}

      {asignaciones.map(a => (
        <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-800">{a.partidos?.torneo}</p>
              <p className="text-xs text-gray-500">{a.partidos?.fecha} · {a.partidos?.hora}</p>
              <p className="text-xs text-gray-500">{a.partidos?.cancha}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor(a.estado)}`}>
              {estadoTexto(a.estado)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs font-medium text-gray-700">{a.usuarios?.nombre}</p>
              <p className="text-xs text-gray-500">Rol: {a.rol}</p>
            </div>
            <button
              onClick={() => cancelar(a.id)}
              disabled={cancelando === a.id}
              className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">
              {cancelando === a.id ? "Cancelando..." : "Cancelar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}