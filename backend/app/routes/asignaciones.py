from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.routes.auth import verificar_token
from datetime import datetime

router = APIRouter()

def hay_conflicto(arbitro_id: str, fecha: str, hora: str, asignacion_excluir: str = None):
    resultado = supabase.table("asignaciones").select("*, partidos(fecha, hora)").eq("arbitro_id", arbitro_id).neq("estado", "cancelado").neq("estado", "rechazado").execute()
    nueva_hora = datetime.strptime(f"{fecha} {hora[:5]}", "%Y-%m-%d %H:%M")
    for a in resultado.data:
        if asignacion_excluir and a["id"] == asignacion_excluir:
            continue
        p = a.get("partidos")
        if not p or p["fecha"] != fecha:
            continue
        hora_existente = p["hora"][:5]
        existente = datetime.strptime(f"{fecha} {hora_existente}", "%Y-%m-%d %H:%M")
        diferencia = abs((nueva_hora - existente).total_seconds() / 60)
        if diferencia < 50:
            return True, hora_existente, round(diferencia)
    return False, None, None

@router.post("/verificar")
def verificar_asignacion(data: dict, usuario=Depends(verificar_token)):
    partido = supabase.table("partidos").select("fecha, hora").eq("id", data["partido_id"]).execute()
    if not partido.data:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    fecha = partido.data[0]["fecha"]
    hora = partido.data[0]["hora"][:5]
    conflicto, hora_conflicto, minutos = hay_conflicto(data["arbitro_id"], fecha, hora)
    if conflicto:
        raise HTTPException(status_code=400, detail=f"El árbitro ya tiene un partido ese día a las {hora_conflicto}. Solo hay {minutos} minutos de diferencia (mínimo 50).")
    return {"ok": True}

@router.post("")
def crear_asignacion(data: dict, usuario=Depends(verificar_token)):
    existente = supabase.table("asignaciones").select("id").eq("partido_id", data["partido_id"]).eq("arbitro_id", data["arbitro_id"]).execute()
    if existente.data:
        raise HTTPException(status_code=400, detail="Este árbitro ya está asignado a este partido")
    partido = supabase.table("partidos").select("fecha, hora").eq("id", data["partido_id"]).execute()
    if not partido.data:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    fecha = partido.data[0]["fecha"]
    hora = partido.data[0]["hora"][:5]
    conflicto, hora_conflicto, minutos = hay_conflicto(data["arbitro_id"], fecha, hora)
    if conflicto:
        raise HTTPException(status_code=400, detail=f"El árbitro ya tiene un partido ese día a las {hora_conflicto}. Solo hay {minutos} minutos de diferencia (mínimo 50).")
    resultado = supabase.table("asignaciones").insert({
        "partido_id": data["partido_id"],
        "arbitro_id": data["arbitro_id"],
        "rol": data["rol"],
        "estado": "pendiente_confirmacion",
        "whatsapp_enviado": False
    }).execute()
    supabase.table("partidos").update({"estado": "asignado"}).eq("id", data["partido_id"]).execute()
    supabase.table("notificaciones").insert({
        "usuario_id": data["arbitro_id"],
        "mensaje": "Tienes una nueva asignación. Confirma o rechaza en la app."
    }).execute()
    return resultado.data[0]

@router.patch("/{asignacion_id}/whatsapp")
def marcar_whatsapp_enviado(asignacion_id: str, usuario=Depends(verificar_token)):
    resultado = supabase.table("asignaciones").update({"whatsapp_enviado": True}).eq("id", asignacion_id).execute()
    return resultado.data[0]

@router.get("")
def listar_asignaciones(usuario=Depends(verificar_token)):
    resultado = supabase.table("asignaciones").select("*, partidos(*), usuarios(*)").neq("estado", "cancelado").execute()
    return resultado.data

@router.get("/pendientes-whatsapp")
def pendientes_whatsapp(usuario=Depends(verificar_token)):
    resultado = supabase.table("asignaciones").select("*, partidos(*), usuarios(nombre, telefono)").eq("whatsapp_enviado", False).neq("estado", "cancelado").neq("estado", "rechazado").execute()
    agrupado = {}
    for a in resultado.data:
        arbitro_id = a["arbitro_id"]
        if arbitro_id not in agrupado:
            agrupado[arbitro_id] = {
                "arbitro_id": arbitro_id,
                "nombre": a["usuarios"]["nombre"],
                "telefono": a["usuarios"]["telefono"],
                "asignaciones": []
            }
        agrupado[arbitro_id]["asignaciones"].append(a)
    return list(agrupado.values())

@router.delete("/{asignacion_id}")
def cancelar_asignacion(asignacion_id: str, usuario=Depends(verificar_token)):
    asignacion = supabase.table("asignaciones").select("*").eq("id", asignacion_id).execute()
    if not asignacion.data:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    a = asignacion.data[0]
    supabase.table("asignaciones").update({"estado": "cancelado", "cancelado_por": usuario["rol"]}).eq("id", asignacion_id).execute()
    supabase.table("partidos").update({"estado": "sin_asignar"}).eq("id", a["partido_id"]).execute()
    supabase.table("notificaciones").insert({
        "usuario_id": a["arbitro_id"],
        "mensaje": "Una asignación tuya fue cancelada por el programador."
    }).execute()
    return {"ok": True}