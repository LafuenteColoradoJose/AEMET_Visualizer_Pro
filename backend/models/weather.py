"""
Modelos de datos y mapeo objeto-relacional (ORM).

Define la estructura de las tablas en la base de datos usando SQLModel.
"""
from datetime import date
from sqlmodel import SQLModel, Field

class WeatherRecord(SQLModel, table=True):
    """
    Representa un registro meteorológico diario de una estación de la AEMET.

    Attributes:
        id (int | None): Identificador único autoincremental.
        estacion (str): Código identificador de la estación meteorológica.
        fecha (date): Fecha de las mediciones.
        tmed (float | None): Temperatura media diaria en ºC.
        tmax (float | None): Temperatura máxima diaria en ºC.
        tmin (float | None): Temperatura mínima diaria en ºC.
        prec (float | None): Precipitación diaria en mm.
        velmedia (float | None): Velocidad media del viento.
        racha (float | None): Racha máxima del viento.
    """
    id: int | None = Field(default=None, primary_key=True)
    estacion: str = Field(index=True)
    fecha: date = Field(index=True)
    
    tmed: float | None = None
    tmax: float | None = None
    tmin: float | None = None
    prec: float | None = None
    velmedia: float | None = None
    racha: float | None = None
