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
    partido = {
        "torneo": data.get("torneo", "").strip() or "Sin torneo",
        "cancha": data.get("cancha", "").strip() or "Sin cancha",
        "fecha": data.get("fecha", ""),
        "hora": data.get("hora", ""),
        "tipo": data.get("tipo", "futbol"),
        "num_periodos": int(data.get("num_periodos") or 2),
        "tiempo_periodo": int(data.get("tiempo_periodo") or 20),
        "tipo_pago": data.get("tipo_pago", "en_cancha"),
        "equipos": data.get("equipos", "").strip() or None,
        "estado": "sin_asignar"
    }
    if not partido["fecha"] or not partido["hora"]:
        raise HTTPException(status_code=400, detail="Fecha y hora son obligatorias")
    resultado = supabase.table("partidos").insert(partido).execute()
    return resultado.data[0]

@router.delete("/{partido_id}")
def eliminar_partido(partido_id: str, usuario=Depends(verificar_token)):
    supabase.table("partidos").delete().eq("id", partido_id).execute()
    return {"ok": True}

def parsear_filas(filas):
    partidos = []
    errores = []
    for i, fila in enumerate(filas, start=2):
        fecha = str(fila.get("fecha", "") or "").strip()
        hora = str(fila.get("hora", "") or "").strip()
        if not fecha or not hora:
            errores.append(f"Fila {i}: falta fecha u hora")
            continue
        try:
            partidos.append({
                "torneo": str(fila.get("torneo", "") or "").strip() or "Sin torneo",
                "cancha": str(fila.get("cancha", "") or "").strip() or "Sin cancha",
                "fecha": fecha,
                "hora": hora,
                "tipo": str(fila.get("tipo", "") or "futbol").strip(),
                "num_periodos": int(fila.get("num_periodos") or 2),
                "tiempo_periodo": int(fila.get("tiempo_periodo") or 20),
                "tipo_pago": str(fila.get("tipo_pago", "") or "en_cancha").strip(),
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
        raise HTTPException(status_code=400, detail="Solo .csv, .xlsx o .xls")

    partidos, errores = parsear_filas(filas)

    if not partidos:
        raise HTTPException(status_code=400, detail=f"No se importó ningún partido. Errores: {errores}")

    resultado = supabase.table("partidos").insert(partidos).execute()
    return {
        "importados": len(resultado.data),
        "errores": errores
    }

@router.get("/plantilla")
def descargar_plantilla(usuario=Depends(verificar_token)):
    import openpyxl
    from fastapi.responses import StreamingResponse
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Partidos"
    headers = ["torneo", "cancha", "fecha", "hora", "tipo", "num_periodos", "tiempo_periodo", "tipo_pago", "equipos"]
    ws.append(headers)
    ws.append(["Copa Élite", "Cancha Norte", "2025-05-17", "08:00", "futbol", 2, 20, "en_cancha", "Deportivo FC vs Atlético Sur"])
    ws.append(["Liga Local", "Cancha Sur", "2025-05-17", "10:00", "futbol_sala", 2, 25, "pendiente", ""])
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=plantilla_partidos.xlsx"}
    )