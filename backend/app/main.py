from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, partidos, arbitros, asignaciones, membresias

app = FastAPI(title="PitaYa API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(partidos.router, prefix="/partidos", tags=["partidos"])
app.include_router(arbitros.router, prefix="/arbitros", tags=["arbitros"])
app.include_router(asignaciones.router, prefix="/asignaciones", tags=["asignaciones"])
app.include_router(membresias.router, prefix="/membresias", tags=["membresias"])

@app.get("/")
def root():
    return {"mensaje": "PitaYa API funcionando"}