import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function NotificarArbitros({ onVolver }) {
  const [arbitros, setArbitros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/asignaciones/pendientes-whatsapp`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setArbitros(await res.json())
    } catch {
      console.error("Error cargando")
    } finally {
      setCargando(false)
    }
  }

  const generarMensaje = (arbitro) => {
    const lista = arbitro.asignaciones.map((a, i) => {
      const p = a.partidos
      return `${i + 1}. ${p?.torneo || "Sin torneo"} — ${p?.hora?.slice(0,5) || ""} — ${p?.cancha || "Sin cancha"} — ${a.rol}`
    }).join("\n")
    return `Hola ${arbitro.nombre}, tienes estos partidos asignados:\n\n${lista}\n\nConfirma en la app. Gracias!`
  }

  const enviar = async (arbitro) => {
    setEnviando(arbitro.arbitro_id)
    const msg = generarMensaje(arbitro)
    window.open(`https://wa.me/57${arbitro.telefono}?text=${encodeURIComponent(msg)}`)
    try {
      const token = localStorage.getItem("token")
      await Promise.all(arbitro.asignaciones.map(a =>
        fetch(`${API}/asignaciones/${a.id}/whatsapp`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        })
      ))
      cargar()
    } catch {
      console.error("Error marcando enviado")
    } finally {
      setEnviando(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onVolver} className="text-sm text-gray-500 hover:text-gray-700">← Volver</button>
        <h2 className="text-base font-semibold text-gray-800">Notificar árbitros</h2>
      </div>

      {cargando && <p className="text-sm text-gray-400">Cargando...</p>}
      {!cargando && arbitros.length === 0 && (
        <p className="text-sm text-gray-400">Todos los árbitros han sido notificados.</p>
      )}

      {arbitros.map(a => (
        <div key={a.arbitro_id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{a.nombre}</p>
              <p className="text-xs text-gray-500">{a.telefono}</p>
              <p className="text-xs text-gray-400 mt-1">{a.asignaciones.length} partido(s) sin notificar</p>
            </div>
            <button
              onClick={() => enviar(a)}
              disabled={enviando === a.arbitro_id}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {enviando === a.arbitro_id ? "Abriendo..." : "Enviar por WhatsApp"}
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            {a.asignaciones.map((asig, i) => (
              <p key={asig.id}>
                {i + 1}. {asig.partidos?.torneo || "Sin torneo"} — {asig.partidos?.hora?.slice(0,5)} — {asig.partidos?.cancha || "Sin cancha"} — {asig.rol}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}