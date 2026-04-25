import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function BoardKanban({ partidos, arbitros, onActualizar }) {
  const [partidoSel, setPartidoSel] = useState(null)
  const [arbitroSel, setArbitroSel] = useState(null)
  const [rol, setRol] = useState("central")
  const [modal, setModal] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [errorConflicto, setErrorConflicto] = useState(null)

  const sinAsignar = partidos.filter(p => p.estado === "sin_asignar")

  const seleccionarPartido = (partido) => {
    setPartidoSel(partido)
    setArbitroSel(null)
    setModal(false)
    setErrorConflicto(null)
  }

  const seleccionarArbitro = async (arbitro) => {
    if (!partidoSel) return
    setArbitroSel(arbitro)
    setErrorConflicto(null)
    setVerificando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/asignaciones/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ partido_id: partidoSel.id, arbitro_id: arbitro.id })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorConflicto(data.detail)
      } else {
        setModal(true)
      }
    } catch {
      setModal(true)
    } finally {
      setVerificando(false)
    }
  }

  const generarMensaje = () => {
    if (!partidoSel || !arbitroSel) return ""
    return `Hola ${arbitroSel.nombre}, tienes partido asignado:\n\nTorneo: ${partidoSel.torneo}\nFecha: ${partidoSel.fecha}\nHora: ${partidoSel.hora}\nCancha: ${partidoSel.cancha}\nTipo: ${partidoSel.tipo}\nTiempos: ${partidoSel.num_periodos} de ${partidoSel.tiempo_periodo} min\nRol: ${rol}\nPago: ${partidoSel.tipo_pago}\n\nConfirma en la app. Gracias!`
  }

  const asignar = async (enviarWhatsapp) => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/asignaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ partido_id: partidoSel.id, arbitro_id: arbitroSel.id, rol })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorConflicto(data.detail)
        setModal(false)
        return
      }
      if (enviarWhatsapp) {
        const msg = generarMensaje()
        window.open(`https://wa.me/57${arbitroSel.telefono}?text=${encodeURIComponent(msg)}`)
        await fetch(`${API}/asignaciones/${data.id}/whatsapp`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setModal(false)
      setPartidoSel(null)
      setArbitroSel(null)
      setErrorConflicto(null)
      onActualizar()
    } catch {
      setErrorConflicto("Error al conectar con el servidor")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-semibold text-gray-800">Board de asignaciones</h2>
        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{sinAsignar.length} sin asignar</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Partidos sin asignar</p>
          {sinAsignar.length === 0 && <p className="text-sm text-gray-400">No hay partidos pendientes</p>}
          {sinAsignar.map(p => (
            <div key={p.id} onClick={() => seleccionarPartido(p)}
              className={`bg-white border rounded-xl p-4 mb-3 cursor-pointer transition-all ${partidoSel?.id === p.id ? "border-purple-400 border-2" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm text-gray-800">{p.torneo}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.tipo === "futbol" ? "bg-purple-50 text-purple-700" : "bg-teal-50 text-teal-700"}`}>
                  {p.tipo === "futbol" ? "Fútbol" : "Fútbol sala"}
                </span>
              </div>
              <p className="text-xs text-gray-500">{p.fecha} · {p.hora}</p>
              <p className="text-xs text-gray-500">{p.cancha}</p>
              {p.equipos && <p className="text-xs text-gray-400 mt-1">{p.equipos}</p>}
              <div className="mt-3 flex justify-between items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.tipo_pago === "en_cancha" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {p.tipo_pago === "en_cancha" ? "En cancha" : "Pendiente"}
                </span>
                <button className="text-xs text-purple-600 hover:underline">Asignar árbitro</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
            {partidoSel ? "Elige un árbitro" : "Árbitros disponibles"}
          </p>
          {verificando && <p className="text-xs text-gray-400 mb-2">Verificando disponibilidad...</p>}
          {errorConflicto && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">
              ⚠️ {errorConflicto}
            </div>
          )}
          {arbitros.length === 0 && <p className="text-sm text-gray-400">No hay árbitros disponibles</p>}
          {arbitros.map(a => (
            <div key={a.id} onClick={() => seleccionarArbitro(a)}
              className={`bg-white border rounded-xl p-4 mb-3 flex items-center gap-3 transition-all ${partidoSel ? "cursor-pointer hover:border-purple-300" : "opacity-50 cursor-not-allowed"} ${arbitroSel?.id === a.id ? "border-purple-400 border-2" : "border-gray-200"}`}>
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-sm font-medium text-purple-700 flex-shrink-0">
                {a.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{a.nombre}</p>
                <p className="text-xs text-gray-500">{a.telefono}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && partidoSel && arbitroSel && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-1">Confirmar asignación</h3>
            <p className="text-sm text-gray-500 mb-4">{arbitroSel.nombre} → {partidoSel.torneo}</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-4">
              <p>{partidoSel.fecha} · {partidoSel.hora}</p>
              <p>{partidoSel.cancha} · {partidoSel.tipo}</p>
              <p>{partidoSel.num_periodos} tiempos de {partidoSel.tiempo_periodo} min</p>
              <p>Pago: {partidoSel.tipo_pago}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Rol</label>
              <select value={rol} onChange={e => setRol(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="central">Árbitro central</option>
                <option value="asistente">Asistente</option>
                <option value="planilla">Planilla</option>
              </select>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-xs text-green-700 mb-4 whitespace-pre-line">
              {generarMensaje()}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => asignar(false)} disabled={cargando}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {cargando ? "Asignando..." : "Asignar"}
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setModal(false); setErrorConflicto(null) }}
                  className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={() => asignar(true)} disabled={cargando}
                  className="flex-1 border border-green-300 text-green-700 py-2 rounded-lg text-sm hover:bg-green-50 disabled:opacity-50">
                  {cargando ? "..." : "Asignar y enviar WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}