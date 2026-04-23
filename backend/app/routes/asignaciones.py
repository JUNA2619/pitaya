from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.routes.auth import verificar_token

router = APIRouter()

@router.post("")
def crear_asignacion(data: dict, usuario=Depends(verificar_token)):
    existente = supabase.table("asignaciones").select("id").eq("partido_id", data["partido_id"]).eq("arbitro_id", data["arbitro_id"]).execute()
    if existente.data:
        raise HTTPException(status_code=400, detail="Este árbitro ya está asignado a este partido")
    
    resultado = supabase.table("asignaciones").insert({
        "partido_id": data["partido_id"],
        "arbitro_id": data["arbitro_id"],
        "rol": data["rol"],
        "estado": "pendiente_confirmacion"
    }).execute()

    supabase.table("partidos").update({"estado": "asignado"}).eq("id", data["partido_id"]).execute()

    supabase.table("notificaciones").insert({
        "usuario_id": data["arbitro_id"],
        "mensaje": f"Tienes una nueva asignación. Confirma o rechaza en la app."
    }).execute()

    return resultado.data[0]

@router.get("")
def listar_asignaciones(usuario=Depends(verificar_token)):
    resultado = supabase.table("asignaciones").select("*, partidos(*), usuarios(*)").execute()
    return resultado.data

@router.delete("/{asignacion_id}")
def cancelar_asignacion(asignacion_id: str, usuario=Depends(verificar_token)):
    asignacion = supabase.table("asignaciones").select("*").eq("id", asignacion_id).execute()
    if not asignacion.data:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    a = asignacion.data[0]
    supabase.table("asignaciones").update({"estado": "cancelado", "cancelado_por": usuario["sub"]}).eq("id", asignacion_id).execute()
    supabase.table("partidos").update({"estado": "sin_asignar"}).eq("id", a["partido_id"]).execute()
    supabase.table("notificaciones").insert({
        "usuario_id": a["arbitro_id"],
        "mensaje": "Una asignación tuya fue cancelada por el programador."
    }).execute()

    return {"ok": True}