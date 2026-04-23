import { useState, useEffect, useRef } from "react"
import BoardKanban from "./BoardKanban"
import GestionArbitros from "./GestionArbitros"

export default function DashboardProgramador({ usuario, onLogout }) {
  const [partidos, setPartidos] = useState([])
  const [arbitros, setArbitros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendoCsv, setSubiendoCsv] = useState(false)
  const [mensajeCsv, setMensajeCsv] = useState(null)
  const [vista, setVista] = useState("board")
  const inputCsvRef = useRef(null)

  useEffect(() => {
    if (vista === "board") cargarDatos()
  }, [vista])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const [resPartidos, resArbitros] = await Promise.all([
        fetch("http://127.0.0.1:8000/partidos", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://127.0.0.1:8000/arbitros", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setPartidos(await resPartidos.json())
      setArbitros(await resArbitros.json())
    } catch {
      console.error("Error cargando datos")
    } finally {
      setCargando(false)
    }
  }

  const subirCsv = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendoCsv(true)
    setMensajeCsv(null)
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", archivo)
      const res = await fetch("http://127.0.0.1:8000/partidos/csv", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setMensajeCsv({ tipo: "ok", texto: `${data.importados} partido(s) importado(s) correctamente.` })
      cargarDatos()
    } catch (err) {
      setMensajeCsv({ tipo: "error", texto: err.message })
    } finally {
      setSubiendoCsv(false)
      inputCsvRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">PitaYa</h1>
          <p className="text-xs text-gray-500">Programador — {usuario.nombre}</p>
        </div>
        <div className="flex items-center gap-3">
          {vista === "board" && (
            <>
              <input
                ref={inputCsvRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={subirCsv}
                className="hidden"
                id="inputCsv"
              />
              <label
                htmlFor="inputCsv"
                className={`text-sm px-4 py-1.5 rounded-lg border cursor-pointer transition-all ${subiendoCsv ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200" : "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"}`}
              >
                {subiendoCsv ? "Subiendo..." : "Subir partidos"}
              </label>
              <button
                onClick={() => setVista("arbitros")}
                className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Árbitros
              </button>
            </>
          )}
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {mensajeCsv && vista === "board" && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm ${mensajeCsv.tipo === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {mensajeCsv.texto}
          <button onClick={() => setMensajeCsv(null)} className="ml-3 underline text-xs">cerrar</button>
        </div>
      )}

      <div className="px-6 py-6">
        {vista === "board" && (
          cargando ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : (
            <BoardKanban
              partidos={partidos}
              arbitros={arbitros}
              onActualizar={cargarDatos}
            />
          )
        )}
        {vista === "arbitros" && (
          <GestionArbitros onVolver={() => setVista("board")} />
        )}
      </div>
    </div>
  )
}