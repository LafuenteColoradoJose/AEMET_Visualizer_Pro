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

import httpx
import logging
from datetime import timedelta
from core.config import settings
from core.database import engine

logger = logging.getLogger(__name__)

async def fetch_aemet_data(estacion: str, fecha_ini: date, fecha_fin: date) -> list[dict]:
    """
    Descarga los datos climatológicos diarios de AEMET para el rango dado.
    Utiliza httpx para las peticiones asíncronas.
    """
    if not settings.AEMET_API_KEY:
        logger.error("AEMET_API_KEY no configurada.")
        return []

    # Formato AEMET: YYYY-MM-DDTHH:MM:SSUTC
    fecha_ini_str = f"{fecha_ini.isoformat()}T00:00:00UTC"
    fecha_fin_str = f"{fecha_fin.isoformat()}T23:59:59UTC"
    
    url = f"https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/datos/fechaini/{fecha_ini_str}/fechafin/{fecha_fin_str}/estacion/{estacion}"
    
    headers = {
        "api_key": settings.AEMET_API_KEY,
        "Accept": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1. Solicitar URL de descarga
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if data.get("estado") != 200:
                logger.error(f"Error AEMET: {data.get('descripcion')}")
                return []
                
            datos_url = data.get("datos")
            if not datos_url:
                return []
                
            # 2. Descargar el JSON real
            datos_resp = await client.get(datos_url)
            datos_resp.raise_for_status()
            
            # AEMET a veces devuelve ISO-8859-15 o latin1 en lugar de UTF-8
            import json
            try:
                return datos_resp.json()
            except Exception:
                text = datos_resp.content.decode('latin-1')
                return json.loads(text)
    except Exception as e:
        logger.error(f"Error descargando datos de AEMET: {e}")
        return []

def safe_float(val: str) -> float | None:
    if not val:
        return None
    try:
        return float(val.replace(',', '.'))
    except ValueError:
        return None

async def sync_station_data_bg(estacion: str):
    """
    Tarea en segundo plano que sincroniza los datos atrasados de la estación.
    Solo descarga meses completos vencidos (hasta el día 5 del mes en curso).
    """
    hoy = date.today()
    if hoy.day < 5:
        # Hasta el día 5, consideramos que el mes anterior aún no está del todo consolidado
        return

    # El último día del mes anterior a hoy
    # Ej: si hoy es 19 de septiembre, el primer día es 1 sept. - 1 día = 31 agosto
    primer_dia_mes_actual = hoy.replace(day=1)
    ultimo_dia_mes_anterior = primer_dia_mes_actual - timedelta(days=1)
    
    with Session(engine) as session:
        # Obtener la fecha máxima guardada en BD
        statement = select(WeatherRecord.fecha).where(WeatherRecord.estacion == estacion).order_by(WeatherRecord.fecha.desc()).limit(1)
        max_fecha_result = session.exec(statement).first()
        
        if not max_fecha_result:
            return  # Si la base de datos está vacía, no lanzamos una descarga gigante por defecto aquí
            
        # max_fecha_result es de tipo date
        max_fecha = max_fecha_result
        
        if max_fecha >= ultimo_dia_mes_anterior:
            # Ya tenemos los datos hasta el mes anterior, no hacemos nada
            return
            
        fecha_ini = max_fecha + timedelta(days=1)
        fecha_fin = ultimo_dia_mes_anterior
        
        logger.info(f"Sincronizando {estacion} desde {fecha_ini} hasta {fecha_fin}...")
        
        raw_data = await fetch_aemet_data(estacion, fecha_ini, fecha_fin)
        if not raw_data:
            return
            
        new_records = []
        for row in raw_data:
            # Formato fecha devuelta: YYYY-MM-DD
            try:
                row_date = date.fromisoformat(row['fecha'])
                # Prevenir duplicados en caso de que AEMET devuelva fechas solapadas
                if row_date <= max_fecha:
                    continue
                    
                record = WeatherRecord(
                    estacion=row.get('indicativo', estacion),
                    fecha=row_date,
                    tmed=safe_float(row.get('tmed')),
                    tmax=safe_float(row.get('tmax')),
                    tmin=safe_float(row.get('tmin')),
                    prec=safe_float(row.get('prec')),
                    velmedia=safe_float(row.get('velmedia')),
                    racha=safe_float(row.get('racha'))
                )
                new_records.append(record)
            except Exception as e:
                logger.warning(f"Error procesando fila {row}: {e}")
                
        if new_records:
            session.add_all(new_records)
            session.commit()
            logger.info(f"Guardados {len(new_records)} nuevos registros.")

