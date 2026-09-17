"""
Capa de servicios (Lógica de negocio).

Contiene las funciones que interactúan con la base de datos y
aplican reglas de negocio sobre los datos meteorológicos.
"""
from datetime import date
from sqlmodel import Session, select
from models.weather import WeatherRecord

def get_historical_data(session: Session, estacion: str, start_date: date, end_date: date) -> list[WeatherRecord]:
    """
    Recupera registros meteorológicos históricos de la base de datos local.
    
    Args:
        session (Session): Sesión de base de datos activa.
        estacion (str): Código de la estación meteorológica a consultar.
        start_date (date): Fecha de inicio del periodo.
        end_date (date): Fecha de fin del periodo.
        
    Returns:
        list[WeatherRecord]: Lista de registros meteorológicos ordenados cronológicamente.
    """
    statement = (
        select(WeatherRecord)
        .where(WeatherRecord.estacion == estacion)
        .where(WeatherRecord.fecha >= start_date)
        .where(WeatherRecord.fecha <= end_date)
        .order_by(WeatherRecord.fecha)
    )
    
    results = session.exec(statement).all()
    return list(results)
