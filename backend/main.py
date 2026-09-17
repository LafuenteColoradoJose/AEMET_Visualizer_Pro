from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import weather

# Instanciamos la aplicación FastAPI
app = FastAPI(
    title="AEMET Visualizer Pro API",
    description="API backend para servir datos de la AEMET procesados y limpios.",
    version="1.0.0"
)

# Configuración de CORS
# Esto es vital para que nuestro futuro frontend en Angular (que correrá en el puerto 4200)
# pueda hacer peticiones HTTP (GET, POST...) al backend (que correrá en el 8000) sin bloqueos de seguridad.
origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluimos el router de clima
app.include_router(weather.router)

@app.get("/")
async def root():
    """
    Ruta raíz para comprobar que la API está viva.
    """
    return {"message": "Bienvenido a AEMET Visualizer Pro API. Ve a /docs para ver la documentación interactiva."}
