from datetime import date
from sqlmodel import SQLModel, Field

class WeatherRecord(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    estacion: str = Field(index=True)  # Identificador de la AEMET, ej. "5402"
    fecha: date = Field(index=True)    # Indexado para búsquedas rápidas por rango
    
    tmed: float | None = None
    tmax: float | None = None
    tmin: float | None = None
    prec: float | None = None
    velmedia: float | None = None
    racha: float | None = None
