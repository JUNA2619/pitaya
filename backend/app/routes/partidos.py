from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.database import supabase
from app.routes.auth import verificar_token
import csv
import io
import openpyxl

router = APIRouter()

@router.get("")
def listar_partidos(usuario=Depends(verificar_token)):
    resultado = supabase.table("partidos").select("*").order("fecha").order("hora").execute()
    return resultado.data

@router.post("")
def crear_partido(data: dict, usuario=Depends(verificar_token)):
    resultado = supabase.table("partidos").insert(data).execute()
    return resultado.data[0]

def parsear_filas(filas):
    campos_requeridos = {"torneo", "cancha", "fecha", "hora", "tipo", "num_periodos", "tiempo_periodo", "tipo_pago"}
    partidos = []
    errores = []

    for i, fila in enumerate(filas, start=2):
        vacios = [c for c in campos_requeridos if not str(fila.get(c, "") or "").strip()]
        if vacios:
            errores.append(f"Fila {i}: campos vacíos — {vacios}")
            continue
        try:
            partidos.append({
                "torneo": str(fila["torneo"]).strip(),
                "cancha": str(fila["cancha"]).strip(),
                "fecha": str(fila["fecha"]).strip(),
                "hora": str(fila["hora"]).strip(),
                "tipo": str(fila["tipo"]).strip(),
                "num_periodos": int(fila["num_periodos"]),
                "tiempo_periodo": int(fila["tiempo_periodo"]),
                "tipo_pago": str(fila["tipo_pago"]).strip(),
                "equipos": str(fila.get("equipos", "") or "").strip() or None,
                "estado": "sin_asignar"
            })
        except Exception as e:
            errores.append(f"Fila {i}: error — {str(e)}")

    return partidos, errores

@router.post("/csv")
async def subir_archivo(file: UploadFile = File(...), usuario=Depends(verificar_token)):
    nombre = file.filename.lower()
    contenido = await file.read()

    if nombre.endswith(".csv"):
        texto = contenido.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(texto))
        filas = list(reader)

    elif nombre.endswith(".xlsx") or nombre.endswith(".xls"):
        wb = openpyxl.load_workbook(io.BytesIO(contenido), data_only=True)
        ws = wb.active
        headers = [str(cell.value).strip() for cell in ws[1]]
        filas = []
        for row in ws.iter_rows(min_row=2, values_only=True):
            if any(v is not None for v in row):
                filas.append(dict(zip(headers, row)))
    else:
        raise HTTPException(status_code=400, detail="Solo se permiten archivos .csv, .xlsx o .xls")

    partidos, errores = parsear_filas(filas)

    if not partidos:
        raise HTTPException(status_code=400, detail=f"No se importó ningún partido. Errores: {errores}")

    resultado = supabase.table("partidos").insert(partidos).execute()
    return {
        "importados": len(resultado.data),
        "errores": errores
    }