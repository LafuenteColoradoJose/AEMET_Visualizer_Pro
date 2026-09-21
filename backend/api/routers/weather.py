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

STATIONS_CATALOG = [
    {"id": "ANDALUCIA", "nombre": "Toda Andalucía (Promedio)", "provincia": "ANDALUCIA"},
    {"id": "6325O", "nombre": "Almería Aeropuerto", "provincia": "ALMERIA"},
    {"id": "3195", "nombre": "Cádiz (Observatorio)", "provincia": "CADIZ"},
    {"id": "5402", "nombre": "Córdoba Aeropuerto", "provincia": "CORDOBA"},
    {"id": "5722A", "nombre": "Granada Aeropuerto", "provincia": "GRANADA"},
    {"id": "4642E", "nombre": "Huelva, Ronda Este", "provincia": "HUELVA"},
    {"id": "5270B", "nombre": "Jaén", "provincia": "JAEN"},
    {"id": "6155A", "nombre": "Málaga Aeropuerto", "provincia": "MALAGA"},
    {"id": "5783", "nombre": "Sevilla Aeropuerto", "provincia": "SEVILLA"}
]

@router.get("/stations", response_model=list[dict])
async def get_stations():
    """
    Devuelve el catálogo de estaciones principales de Andalucía,
    incluyendo un registro virtual para el promedio regional.
    """
    return STATIONS_CATALOG

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
    
    # Si no hay datos (o hay muy pocos para un año entero) y se pidió explícitamente ese rango, intentamos descarga bajo demanda
    # Comprobamos si el rango solicitado es > 30 días y no hay datos
    from services.aemet_service import backfill_historical_data
    delta = (end_date - start_date).days
    
    if len(records) < (delta * 0.5):  # Si falta más de la mitad de los días
        # Descargar de AEMET síncronamente (puede tardar 1-3 segundos)
        records = await backfill_historical_data(session, estacion, start_date, end_date)
        
    return records
