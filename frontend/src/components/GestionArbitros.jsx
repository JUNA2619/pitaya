import { useState, useEffect } from "react"

export default function GestionArbitros({ onVolver }) {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(null)

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  const cargarSolicitudes = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://127.0.0.1:8000/membresias", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSolicitudes(await res.json())
    } catch {
      console.error("Error cargando solicitudes")
    } finally {
      setCargando(false)
    }
  }

  const responder = async (id, estado) => {
    setProcesando(id)
    try {
      const token = localStorage.getItem("token")
      await fetch(`http://127.0.0.1:8000/membresias/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado })
      })
      cargarSolicitudes()
    } catch {
      console.error("Error respondiendo solicitud")
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onVolver} className="text-sm text-gray-500 hover:text-gray-700">← Volver</button>
        <h2 className="text-base font-semibold text-gray-800">Solicitudes de árbitros</h2>
      </div>

      {cargando && <p className="text-sm text-gray-400">Cargando...</p>}

      {!cargando && solicitudes.length === 0 && (
        <p className="text-sm text-gray-400">No hay solicitudes pendientes.</p>
      )}

      {solicitudes.map(s => (
        <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">{s.usuarios?.nombre}</p>
            <p className="text-xs text-gray-500">{s.usuarios?.correo}</p>
            <p className="text-xs text-gray-500">{s.usuarios?.telefono}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => responder(s.id, "rechazada")}
              disabled={procesando === s.id}
              className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              onClick={() => responder(s.id, "aprobada")}
              disabled={procesando === s.id}
              className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Aprobar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}