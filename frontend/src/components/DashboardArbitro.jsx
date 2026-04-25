import { useState, useEffect } from "react"
import BoardKanban from "./BoardKanban"
import CrearPartido from "./CrearPartido"
import PartidosAsignados from "./PartidosAsignados"
import NotificarArbitros from "./NotificarArbitros"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function DashboardProgramador({ usuario, onLogout }) {
  const [partidos, setPartidos] = useState([])
  const [arbitros, setArbitros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [vista, setVista] = useState("board")
  const [pendientesWhatsapp, setPendientesWhatsapp] = useState(0)

  useEffect(() => {
    if (vista === "board") cargarDatos()
  }, [vista])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const [resPartidos, resArbitros, resPendientes] = await Promise.all([
        fetch(`${API}/partidos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/arbitros`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/asignaciones/pendientes-whatsapp`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      setPartidos(await resPartidos.json())
      setArbitros(await resArbitros.json())
      const pendientes = await resPendientes.json()
      setPendientesWhatsapp(pendientes.length)
    } catch {
      console.error("Error cargando datos")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">PitaYa</h1>
          <p className="text-xs text-gray-500">Programador — {usuario.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          {vista === "board" && (
            <>
              <button onClick={() => setMostrarCrear(true)}
                className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700">
                + Partido
              </button>
              <button onClick={() => setVista("asignados")}
                className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                Asignados
              </button>
              <button onClick={() => setVista("notificar")}
                className={`relative text-sm px-3 py-1.5 rounded-lg border transition-all ${pendientesWhatsapp > 0 ? "bg-green-600 text-white border-green-600 hover:bg-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                Notificar
                {pendientesWhatsapp > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {pendientesWhatsapp}
                  </span>
                )}
              </button>
            </>
          )}
          <button onClick={onLogout}
            className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {vista === "board" && (
          cargando ? <p className="text-gray-400 text-sm">Cargando...</p> :
          <BoardKanban partidos={partidos} arbitros={arbitros} onActualizar={cargarDatos} />
        )}
        {vista === "asignados" && <PartidosAsignados onVolver={() => setVista("board")} />}
        {vista === "notificar" && <NotificarArbitros onVolver={() => { setVista("board") }} />}
      </div>

      {mostrarCrear && (
        <CrearPartido
          onGuardado={() => { setMostrarCrear(false); cargarDatos() }}
          onCancelar={() => setMostrarCrear(false)}
        />
      )}
    </div>
  )
}