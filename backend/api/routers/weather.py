from datetime import date, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from core.database import get_session
from services.aemet_service import get_historical_data
from models.weather import WeatherRecord

# Creamos el router
router = APIRouter(
    prefix="/api/v1/weather",
    tags=["weather"]
)

# Definimos la inyección de dependencias (según la skill oficial de FastAPI)
SessionDep = Annotated[Session, Depends(get_session)]

@router.get("/historical", response_model=list[WeatherRecord])
async def get_weather(
    session: SessionDep,
    estacion: Annotated[str, Query(description="ID de la estación (Por defecto 5402 - Córdoba)")] = "5402",
    start_date: Annotated[date | None, Query(description="Fecha inicio (YYYY-MM-DD)")] = None,
    end_date: Annotated[date | None, Query(description="Fecha fin (YYYY-MM-DD)")] = None,
):
    """
    Devuelve los datos históricos del clima para una estación y rango de fechas.
    Si no se especifican fechas, devuelve por defecto el último año de datos.
    """
    # Lógica por defecto para las fechas
    if not end_date:
        end_date = date.today()
    if not start_date:
        # Por defecto mostramos un año hacia atrás desde la fecha final
        start_date = end_date - timedelta(days=365)
        
    records = get_historical_data(session, estacion, start_date, end_date)
    return records
