from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.routes.auth import verificar_token

router = APIRouter()

@router.get("")
def listar_solicitudes(usuario=Depends(verificar_token)):
    resultado = supabase.table("membresias").select("*, usuarios(nombre, correo, telefono)").eq("estado", "pendiente").execute()
    return resultado.data

@router.patch("/{membresia_id}")
def responder_solicitud(membresia_id: str, data: dict, usuario=Depends(verificar_token)):
    estado = data.get("estado")
    if estado not in ("aprobada", "rechazada"):
        raise HTTPException(status_code=400, detail="Estado inválido")
    
    resultado = supabase.table("membresias").update({"estado": estado}).eq("id", membresia_id).execute()
    if not resultado.data:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")
    
    return resultado.data[0]