from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import supabase
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "pitaya_secret_key_2025")

class RegistroRequest(BaseModel):
    nombre: str
    correo: str
    contrasena: str
    telefono: str
    rol: str

class LoginRequest(BaseModel):
    correo: str
    contrasena: str

def crear_token(usuario_id: str, rol: str):
    payload = {
        "sub": usuario_id,
        "rol": rol,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

@router.post("/registro")
def registro(data: RegistroRequest):
    existente = supabase.table("usuarios").select("id").eq("correo", data.correo).execute()
    if existente.data:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    nuevo = supabase.table("usuarios").insert({
        "nombre": data.nombre,
        "correo": data.correo,
        "contrasena": data.contrasena,
        "telefono": data.telefono,
        "rol": data.rol
    }).execute()
    usuario = nuevo.data[0]
    token = crear_token(usuario["id"], usuario["rol"])
    return {"token": token, "usuario": usuario}

@router.post("/login")
def login(data: LoginRequest):
    resultado = supabase.table("usuarios").select("*").eq("correo", data.correo).eq("contrasena", data.contrasena).execute()
    if not resultado.data:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    usuario = resultado.data[0]
    token = crear_token(usuario["id"], usuario["rol"])
    return {"token": token, "usuario": usuario}