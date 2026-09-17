from datetime import date
from sqlmodel import Session, select
from models.weather import WeatherRecord

def get_historical_data(session: Session, estacion: str, start_date: date, end_date: date):
    """
    Consulta la base de datos SQLite para obtener los registros meteorológicos.
    
    NOTA: Tal como acordamos, esta es la versión conectada a SQLite (Idea 2). 
    Si en un futuro la petición abarca fechas que no están en la BD (ej. el día de hoy), 
    aquí añadiremos la llamada a tu script 'descargar_chunk', limpiaremos 
    con pandas, haremos session.add(), y luego devolveremos el resultado completo.
    """
    statement = (
        select(WeatherRecord)
        .where(WeatherRecord.estacion == estacion)
        .where(WeatherRecord.fecha >= start_date)
        .where(WeatherRecord.fecha <= end_date)
        .order_by(WeatherRecord.fecha)
    )
    
    results = session.exec(statement).all()
    return results
