"""
Enrutador de endpoints meteorológicos.

Define las rutas de la API REST para interactuar con los datos del clima.
"""
from datetime import date, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlmodel import Session

from core.database import get_session
from services.aemet_service import get_historical_data, sync_station_data_bg
from models.weather import WeatherRecord

router = APIRouter(
    prefix="/api/v1/weather",
    tags=["weather"]
)

SessionDep = Annotated[Session, Depends(get_session)]

@router.get("/historical", response_model=list[WeatherRecord])
async def get_weather(
    session: SessionDep,
    background_tasks: BackgroundTasks,
    estacion: Annotated[str, Query(description="ID de la estación (Por defecto 5402 - Córdoba)")] = "5402",
    start_date: Annotated[date | None, Query(description="Fecha inicio (YYYY-MM-DD)")] = None,
    end_date: Annotated[date | None, Query(description="Fecha fin (YYYY-MM-DD)")] = None,
) -> list[WeatherRecord]:
    """
    Devuelve los datos históricos del clima para una estación y rango de fechas.
    
    Si no se especifican fechas, por defecto devuelve los datos del último
    año completo (hasta el día actual).
    
    Args:
        session (SessionDep): Dependencia inyectada con la sesión a la BD.
        estacion (str): ID de la estación.
        start_date (date | None): Fecha de inicio opcional.
        end_date (date | None): Fecha de fin opcional.
        
    Returns:
        list[WeatherRecord]: Lista de mediciones climáticas del rango indicado.
    """
    if not end_date:
        # Por defecto, fin del mes anterior (meses consolidados enteros)
        today = date.today()
        end_date = today.replace(day=1) - timedelta(days=1)
    if not start_date:
        # Día 1 del mes equivalente del año anterior (ej: 01-Sep-2025 a 31-Ago-2026)
        next_day = end_date + timedelta(days=1)
        start_date = date(next_day.year - 1, next_day.month, 1)
        
    # Programamos la posible actualización en segundo plano
    background_tasks.add_task(sync_station_data_bg, estacion)
        
    records = get_historical_data(session, estacion, start_date, end_date)
    return records
