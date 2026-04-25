import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function DashboardArbitro({ usuario, onLogout }) {
  const [asignaciones, setAsignaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/arbitros/mis-asignaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAsignaciones(await res.json())
    } catch {
      console.error("Error cargando datos")
    } finally {
      setCargando(false)
    }
  }

  const responderAsignacion = async (id, estado) => {
    setProcesando(id)
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API}/arbitros/asignaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado })
      })
      cargarDatos()
    } catch {
      console.error("Error respondiendo")
    } finally {
      setProcesando(null)
    }
  }

  const pendientes = asignaciones.filter(a => a.estado === "pendiente_confirmacion")
  const confirmadas = asignaciones.filter(a => a.estado === "confirmado")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">PitaYa</h1>
          <p className="text-xs text-gray-500">Árbitro — {usuario.nombre}</p>
        </div>
        <button onClick={onLogout}
          className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
          Cerrar sesión
        </button>
      </div>

      <div className="px-6 py-6">
        {cargando && <p className="text-sm text-gray-400">Cargando...</p>}

        {!cargando && (
          <div>
            {pendientes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Por confirmar</p>
                {pendientes.map(a => (
                  <div key={a.id} className="bg-white border border-yellow-200 rounded-xl p-4 mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm text-gray-800">{a.partidos?.torneo}</span>
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">Pendiente</span>
                    </div>
                    <p className="text-xs text-gray-500">{a.partidos?.fecha} · {a.partidos?.hora}</p>
                    <p className="text-xs text-gray-500">{a.partidos?.cancha}</p>
                    <p className="text-xs text-gray-500">Rol: {a.rol}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => responderAsignacion(a.id, "rechazado")}
                        disabled={procesando === a.id}
                        className="flex-1 text-xs border border-red-200 text-red-600 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">
                        Rechazar
                      </button>
                      <button onClick={() => responderAsignacion(a.id, "confirmado")}
                        disabled={procesando === a.id}
                        className="flex-1 text-xs bg-purple-600 text-white py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                        Confirmar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Confirmados</p>
            {confirmadas.length === 0 && <p className="text-sm text-gray-400">No tienes partidos confirmados.</p>}
            {confirmadas.map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm text-gray-800">{a.partidos?.torneo}</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Confirmado</span>
                </div>
                <p className="text-xs text-gray-500">{a.partidos?.fecha} · {a.partidos?.hora}</p>
                <p className="text-xs text-gray-500">{a.partidos?.cancha}</p>
                <p className="text-xs text-gray-500">Rol: {a.rol} · Pago: {a.partidos?.tipo_pago}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}