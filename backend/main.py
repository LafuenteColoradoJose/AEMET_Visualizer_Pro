"""
Punto de entrada principal de la aplicación AEMET Visualizer Pro.

Este módulo inicializa la aplicación FastAPI, configura los middlewares
(como CORS) e incluye los routers necesarios para la API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import weather

app = FastAPI(
    title="AEMET Visualizer Pro API",
    description="API backend para servir datos de la AEMET procesados y limpios.",
    version="1.0.0"
)

# Configuración de CORS
origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    "https://aemet-visualizer-pro.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router)

@app.get("/")
async def root():
    """
    Ruta raíz para verificar el estado de la API.

    Returns:
        dict: Un mensaje de bienvenida indicando que la API está operativa.
    """
    return {"message": "Bienvenido a AEMET Visualizer Pro API. Ve a /docs para ver la documentación interactiva."}
