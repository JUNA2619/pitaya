import { useState, useEffect } from "react"

export default function ReporteMensual({ token }) {
  const [reporte, setReporte] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/arbitros/reporte-mensual", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setReporte(data); setCargando(false) })
      .catch(() => setCargando(false))
  }, [])

  if (cargando) return <p className="text-sm text-gray-400">Cargando reporte...</p>
  if (!reporte) return <p className="text-sm text-gray-400">Error cargando reporte.</p>

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">Reporte mensual</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{reporte.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total partidos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{reporte.en_cancha}</p>
          <p className="text-xs text-gray-500 mt-1">Pagados en cancha</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{reporte.pendiente}</p>
          <p className="text-xs text-gray-500 mt-1">Pagos pendientes</p>
        </div>
      </div>

      <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Detalle de partidos</p>
      {reporte.asignaciones.length === 0 && (
        <p className="text-sm text-gray-400">No tienes partidos confirmados este mes.</p>
      )}
      {reporte.asignaciones.map(a => (
        <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-800">{a.partidos?.torneo}</p>
            <p className="text-xs text-gray-500">{a.partidos?.fecha} · {a.partidos?.hora}</p>
            <p className="text-xs text-gray-500">{a.partidos?.cancha} · Rol: {a.rol}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${a.partidos?.tipo_pago === "en_cancha" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
            {a.partidos?.tipo_pago === "en_cancha" ? "En cancha" : "Pendiente"}
          </span>
        </div>
      ))}
    </div>
  )
}