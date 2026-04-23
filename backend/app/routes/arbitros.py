from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.routes.auth import verificar_token

router = APIRouter()

@router.get("")
def listar_arbitros(usuario=Depends(verificar_token)):
    resultado = supabase.table("usuarios").select("*").eq("rol", "arbitro").execute()
    return resultado.data

@router.get("/mis-asignaciones")
def mis_asignaciones(usuario=Depends(verificar_token)):
    print("SUB DEL TOKEN:", usuario["sub"])
    resultado = supabase.table("asignaciones").select("*, partidos(*)").eq("arbitro_id", usuario["sub"]).neq("estado", "cancelado").execute()
    print("RESULTADO:", resultado.data)
    return resultado.data

@router.patch("/asignaciones/{asignacion_id}")
def responder_asignacion(asignacion_id: str, data: dict, usuario=Depends(verificar_token)):
    estado = data.get("estado")
    if estado not in ("confirmado", "rechazado"):
        raise HTTPException(status_code=400, detail="Estado inválido")
    resultado = supabase.table("asignaciones").update({"estado": estado}).eq("id", asignacion_id).execute()
    return resultado.data[0]

@router.get("/disponibilidad")
def ver_disponibilidad(usuario=Depends(verificar_token)):
    resultado = supabase.table("disponibilidades").select("*").eq("arbitro_id", usuario["sub"]).execute()
    return resultado.data

@router.post("/disponibilidad")
def guardar_disponibilidad(data: dict, usuario=Depends(verificar_token)):
    existente = supabase.table("disponibilidades").select("id").eq("arbitro_id", usuario["sub"]).eq("fecha", data["fecha"]).execute()
    if existente.data:
        resultado = supabase.table("disponibilidades").update({
            "hora_inicio": data["hora_inicio"],
            "hora_fin": data["hora_fin"]
        }).eq("id", existente.data[0]["id"]).execute()
    else:
        resultado = supabase.table("disponibilidades").insert({
            "arbitro_id": usuario["sub"],
            "fecha": data["fecha"],
            "hora_inicio": data["hora_inicio"],
            "hora_fin": data["hora_fin"]
        }).execute()
    return resultado.data[0]

@router.delete("/disponibilidad/{disponibilidad_id}")
def eliminar_disponibilidad(disponibilidad_id: str, usuario=Depends(verificar_token)):
    supabase.table("disponibilidades").delete().eq("id", disponibilidad_id).execute()
    return {"ok": True}

@router.get("/notificaciones")
def ver_notificaciones(usuario=Depends(verificar_token)):
    resultado = supabase.table("notificaciones").select("*").eq("usuario_id", usuario["sub"]).order("created_at", desc=True).execute()
    return resultado.data

@router.patch("/notificaciones/{notificacion_id}/leer")
def marcar_leida(notificacion_id: str, usuario=Depends(verificar_token)):
    resultado = supabase.table("notificaciones").update({"leida": True}).eq("id", notificacion_id).execute()
    return resultado.data[0]

@router.get("/reporte-mensual")
def reporte_mensual(usuario=Depends(verificar_token)):
    resultado = supabase.table("asignaciones").select("*, partidos(*)").eq("arbitro_id", usuario["sub"]).eq("estado", "confirmado").execute()
    asignaciones = resultado.data

    total = len(asignaciones)
    en_cancha = len([a for a in asignaciones if a["partidos"] and a["partidos"]["tipo_pago"] == "en_cancha"])
    pendiente = len([a for a in asignaciones if a["partidos"] and a["partidos"]["tipo_pago"] == "pendiente"])

    return {
        "total": total,
        "en_cancha": en_cancha,
        "pendiente": pendiente,
        "asignaciones": asignaciones
    }