"""
Capa de servicios (Lógica de negocio).

Contiene las funciones que interactúan con la base de datos y
aplican reglas de negocio sobre los datos meteorológicos.
"""
from datetime import date
from sqlmodel import Session, select, func
from models.weather import WeatherRecord

def get_historical_data(session: Session, estacion: str, start_date: date, end_date: date) -> list[WeatherRecord]:
    """
    Recupera registros meteorológicos históricos de la base de datos local.
    Si la estacion es 'ANDALUCIA', devuelve el promedio diario de las estaciones principales.
    """
    if estacion == "ANDALUCIA":
        PREMIUM_STATIONS = ["6325O", "3195", "5402", "5722A", "4642E", "5270B", "6155A", "5783"]
        statement = (
            select(
                WeatherRecord.fecha,
                func.avg(WeatherRecord.tmed).label("tmed"),
                func.avg(WeatherRecord.tmax).label("tmax"),
                func.avg(WeatherRecord.tmin).label("tmin"),
                func.avg(WeatherRecord.prec).label("prec"),
                func.avg(WeatherRecord.velmedia).label("velmedia"),
                func.max(WeatherRecord.racha).label("racha")
            )
            .where(
                WeatherRecord.estacion.in_(PREMIUM_STATIONS),
                WeatherRecord.fecha >= start_date,
                WeatherRecord.fecha <= end_date
            )
            .group_by(WeatherRecord.fecha)
            .order_by(WeatherRecord.fecha.asc())
        )
        
        results = session.exec(statement).all()
        return [
            WeatherRecord(
                estacion="ANDALUCIA",
                fecha=row.fecha,
                tmed=round(row.tmed, 1) if row.tmed is not None else None,
                tmax=round(row.tmax, 1) if row.tmax is not None else None,
                tmin=round(row.tmin, 1) if row.tmin is not None else None,
                prec=round(row.prec, 1) if row.prec is not None else None,
                velmedia=round(row.velmedia, 1) if row.velmedia is not None else None,
                racha=round(row.racha, 1) if row.racha is not None else None,
            )
            for row in results
        ]

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


async def backfill_historical_data(session: Session, estacion: str, start_date: date, end_date: date) -> list[WeatherRecord]:
    """
    Descarga bajo demanda un rango de fechas histórico que falta en la base de datos,
    lo guarda y lo devuelve. Útil para peticiones explícitas de años pasados.
    La API de AEMET limita a 6 meses por petición, así que hacemos chunking.
    """
    logger.info(f"Backfill on-demand para {estacion} desde {start_date} hasta {end_date}...")
    
    current_start = start_date
    raw_data = []
    
    import asyncio # Ensure it's imported
    
    while current_start <= end_date:
        current_end = current_start + timedelta(days=175) # 175 días < 6 meses
        if current_end > end_date:
            current_end = end_date
            
        chunk_data = await fetch_aemet_data(estacion, current_start, current_end)
        if chunk_data:
            raw_data.extend(chunk_data)
            
        current_start = current_end + timedelta(days=1)
        await asyncio.sleep(2.5)  # MUY CONSERVADOR: 2.5s entre peticiones para garantizar 0 bloqueos AEMET
        
    if not raw_data:
        return get_historical_data(session, estacion, start_date, end_date)
        
    new_records = []
    for row in raw_data:
        try:
            row_date = date.fromisoformat(row['fecha'])
            
            # Asegurarnos de que no exista ya en BD para evitar IntegrityError (si la PK es estacion+fecha)
            # En SQLite es rápido, pero mejor comprobar si no es muy grande.
            # Nuestro get_historical_data de router lo inserta.
            
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
            logger.warning(f"Error procesando fila {row} en backfill: {e}")
            
    if new_records:
        # Prevenir duplicados borrando posibles solapamientos o usando merge, pero en SQLAlchemy ORM 
        # sin configuración de upsert nativo, lo más seguro es filtrar los que ya existen.
        existing_stmt = select(WeatherRecord.fecha).where(
            WeatherRecord.estacion == estacion,
            WeatherRecord.fecha >= start_date,
            WeatherRecord.fecha <= end_date
        )
        existing_dates = set(session.exec(existing_stmt).all())
        
        to_insert = [r for r in new_records if r.fecha not in existing_dates]
        
        if to_insert:
            session.add_all(to_insert)
            session.commit()
            logger.info(f"Backfill completado: {len(to_insert)} registros insertados.")
            
    # Volvemos a leer de la BD para asegurar el orden y formato
    return get_historical_data(session, estacion, start_date, end_date)
