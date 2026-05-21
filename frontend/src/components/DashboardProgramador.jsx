import { useState, useEffect, useRef } from "react"
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
  const [subiendoExcel, setSubiendoExcel] = useState(false)
  const [mensajeExcel, setMensajeExcel] = useState(null)
  const inputExcelRef = useRef(null)

  useEffect(() => {
    if (vista === "board") cargarDatos()
  }, [vista])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const headers = { Authorization: `Bearer ${token}` }
      const [resPartidos, resArbitros, resPendientes] = await Promise.all([
        fetch(`${API}/partidos`, { headers }),
        fetch(`${API}/arbitros`, { headers }),
        fetch(`${API}/asignaciones/pendientes-whatsapp`, { headers })
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

  const subirExcel = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendoExcel(true)
    setMensajeExcel(null)
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", archivo)
      const res = await fetch(`${API}/partidos/excel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      let texto = `${data.importados} partido(s) importado(s) correctamente.`
      if (data.errores?.length > 0) {
        texto += ` ${data.errores.length} fila(s) con error: ${data.errores.join(" | ")}`
      }
      setMensajeExcel({ tipo: data.errores?.length > 0 ? "warn" : "ok", texto })
      cargarDatos()
    } catch (err) {
      setMensajeExcel({ tipo: "error", texto: err.message || "No se pudo subir el archivo." })
    } finally {
      setSubiendoExcel(false)
      if (inputExcelRef.current) inputExcelRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">PitaYa</h1>
          <p className="text-xs text-gray-500">Coordinador — {usuario.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          {vista === "board" && (
            <>
              <button onClick={() => setMostrarCrear(true)}
                className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700">
                + Partido
              </button>
              <input
                ref={inputExcelRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={subirExcel}
                className="hidden"
                id="inputExcel"
              />
              <label
                htmlFor="inputExcel"
                className={`text-sm px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${subiendoExcel ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {subiendoExcel ? "Subiendo..." : "Subir Excel"}
              </label>
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

      {mensajeExcel && vista === "board" && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm ${mensajeExcel.tipo === "ok" ? "bg-green-50 text-green-700" : mensajeExcel.tipo === "warn" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
          {mensajeExcel.texto}
          <button onClick={() => setMensajeExcel(null)} className="ml-3 underline text-xs">cerrar</button>
        </div>
      )}

      <div className="px-6 py-6">
        {vista === "board" && (
          cargando ? <p className="text-gray-400 text-sm">Cargando...</p> :
          <BoardKanban partidos={partidos} arbitros={arbitros} onActualizar={cargarDatos} />
        )}
        {vista === "asignados" && <PartidosAsignados onVolver={() => setVista("board")} />}
        {vista === "notificar" && <NotificarArbitros onVolver={() => setVista("board")} />}
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