import { useState, useEffect } from "react"
import ReporteMensual from "./ReporteMensual"

export default function DashboardArbitro({ usuario, onLogout }) {
  const [asignaciones, setAsignaciones] = useState([])
  const [disponibilidad, setDisponibilidad] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState("agenda")
  const [nuevaDisp, setNuevaDisp] = useState({ fecha: "", hora_inicio: "", hora_fin: "" })
  const [guardando, setGuardando] = useState(false)
  const [procesando, setProcesando] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const headers = { Authorization: `Bearer ${token}` }
      const [resAsig, resDisp, resNoti] = await Promise.all([
        fetch("http://127.0.0.1:8000/arbitros/mis-asignaciones", { headers }),
        fetch("http://127.0.0.1:8000/arbitros/disponibilidad", { headers }),
        fetch("http://127.0.0.1:8000/arbitros/notificaciones", { headers })
      ])
      setAsignaciones(await resAsig.json())
      setDisponibilidad(await resDisp.json())
      setNotificaciones(await resNoti.json())
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
      await fetch(`http://127.0.0.1:8000/arbitros/asignaciones/${id}`, {
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

  const guardarDisponibilidad = async () => {
    if (!nuevaDisp.fecha || !nuevaDisp.hora_inicio || !nuevaDisp.hora_fin) return
    setGuardando(true)
    try {
      const token = localStorage.getItem("token")
      await fetch("http://127.0.0.1:8000/arbitros/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(nuevaDisp)
      })
      setNuevaDisp({ fecha: "", hora_inicio: "", hora_fin: "" })
      cargarDatos()
    } catch {
      console.error("Error guardando disponibilidad")
    } finally {
      setGuardando(false)
    }
  }

  const eliminarDisponibilidad = async (id) => {
    const token = localStorage.getItem("token")
    await fetch(`http://127.0.0.1:8000/arbitros/disponibilidad/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    cargarDatos()
  }

  const marcarLeida = async (id) => {
    const token = localStorage.getItem("token")
    await fetch(`http://127.0.0.1:8000/arbitros/notificaciones/${id}/leer`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    })
    cargarDatos()
  }

  const pendientes = asignaciones.filter(a => a.estado === "pendiente_confirmacion")
  const confirmadas = asignaciones.filter(a => a.estado === "confirmado")
  const noLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">PitaYa</h1>
          <p className="text-xs text-gray-500">Árbitro — {usuario.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          {["agenda", "disponibilidad", "notificaciones", "reporte"].map(v => (
            <button key={v} onClick={() => setVista(v)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all relative ${vista === v ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
              {v === "notificaciones" && noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {noLeidas}
                </span>
              )}
            </button>
          ))}
          <button onClick={onLogout}
            className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {cargando && <p className="text-sm text-gray-400">Cargando...</p>}

        {!cargando && vista === "agenda" && (
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

        {!cargando && vista === "disponibilidad" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Agregar disponibilidad</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
                  <input type="date" value={nuevaDisp.fecha}
                    onChange={e => setNuevaDisp({ ...nuevaDisp, fecha: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                  <input type="time" value={nuevaDisp.hora_inicio}
                    onChange={e => setNuevaDisp({ ...nuevaDisp, hora_inicio: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                  <input type="time" value={nuevaDisp.hora_fin}
                    onChange={e => setNuevaDisp({ ...nuevaDisp, hora_fin: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400" />
                </div>
              </div>
              <button onClick={guardarDisponibilidad} disabled={guardando}
                className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                {guardando ? "Guardando..." : "Guardar disponibilidad"}
              </button>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Mis disponibilidades</p>
            {disponibilidad.length === 0 && <p className="text-sm text-gray-400">No tienes disponibilidades registradas.</p>}
            {disponibilidad.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(d => (
              <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">{d.fecha}</p>
                  <p className="text-xs text-gray-500">{d.hora_inicio} — {d.hora_fin}</p>
                </div>
                <button onClick={() => eliminarDisponibilidad(d.id)}
                  className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
              </div>
            ))}
          </div>
        )}

        {!cargando && vista === "notificaciones" && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Notificaciones</p>
            {notificaciones.length === 0 && <p className="text-sm text-gray-400">No tienes notificaciones.</p>}
            {notificaciones.map(n => (
              <div key={n.id} className={`bg-white border rounded-xl p-4 mb-3 flex justify-between items-start ${!n.leida ? "border-purple-200" : "border-gray-200"}`}>
                <div>
                  <p className={`text-sm ${!n.leida ? "font-medium text-gray-800" : "text-gray-500"}`}>{n.mensaje}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString("es-CO")}</p>
                </div>
                {!n.leida && (
                  <button onClick={() => marcarLeida(n.id)}
                    className="text-xs text-purple-600 hover:underline ml-4 flex-shrink-0">
                    Marcar leída
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!cargando && vista === "reporte" && (
  <ReporteMensual token={localStorage.getItem("token")} />
)}
    </div>
  )
}