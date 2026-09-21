import asyncio
import os
import sys
from datetime import date
from sqlmodel import Session
import logging

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.database import engine
from services.aemet_service import backfill_historical_data

logging.basicConfig(level=logging.INFO)

STATIONS = [
    "6325O", # Almeria
    "3195",  # Cadiz
    "5402",  # Cordoba
    "5530E", # Granada
    "4642E", # Huelva
    "5270B", # Jaen
    "6155A", # Malaga
    "5783"   # Sevilla
]

async def main():
    # Descargar datos desde 1950 hasta hoy
    # El usuario prefiere obtener todo el histórico posible, sin importar el tiempo
    start_date = date(1950, 1, 1)
    end_date = date.today()
    
    with Session(engine) as session:
        for est in STATIONS:
            print(f"=== Seding {est} desde {start_date} hasta {end_date} ===")
            await backfill_historical_data(session, est, start_date, end_date)
            print(f"=== {est} terminado ===")

if __name__ == "__main__":
    asyncio.run(main())
