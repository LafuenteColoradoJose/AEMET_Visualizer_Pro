import os
import sys
import pandas as pd
from sqlmodel import SQLModel, Session

# Añadimos la raíz del backend al path para poder importar core y models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import engine
from models.weather import WeatherRecord

def importar_csv():
    print("1. Creando tablas en la base de datos (weather.db)...")
    SQLModel.metadata.create_all(engine)
    
    csv_path = "data/historico_cordoba_limpio.csv"
    if not os.path.exists(csv_path):
        print(f"ERROR: No se encuentra el archivo {csv_path}")
        return
        
    print(f"2. Leyendo el archivo {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Aseguramos que la columna de fecha sea tipo date de Python
    df['fecha'] = pd.to_datetime(df['fecha']).dt.date
    
    estacion_cordoba = "5402"
    records = []
    
    print("3. Preparando registros...")
    for _, row in df.iterrows():
        record = WeatherRecord(
            estacion=estacion_cordoba,
            fecha=row['fecha'],
            # pd.isna() detecta los nulos que Pandas insertó (los huecos sin datos)
            tmed=None if pd.isna(row.get('tmed')) else float(row['tmed']),
            tmax=None if pd.isna(row.get('tmax')) else float(row['tmax']),
            tmin=None if pd.isna(row.get('tmin')) else float(row['tmin']),
            prec=None if pd.isna(row.get('prec')) else float(row['prec']),
            velmedia=None if pd.isna(row.get('velmedia')) else float(row['velmedia']),
            racha=None if pd.isna(row.get('racha')) else float(row['racha'])
        )
        records.append(record)
        
    print(f"4. Insertando {len(records)} registros en SQLite. Por favor, espera...")
    with Session(engine) as session:
        session.add_all(records)
        session.commit()
        
    print("¡Migración completada con éxito! Ya tienes tu base de datos lista.")

if __name__ == "__main__":
    importar_csv()
