from datetime import date
from fastapi.testclient import TestClient
from sqlmodel import Session
from models.weather import WeatherRecord

def test_root_endpoint(client: TestClient):
    """Prueba que el endpoint raíz funciona correctamente."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_get_historical_weather_empty(client: TestClient):
    """Prueba el endpoint de histórico cuando la BD está vacía."""
    response = client.get("/api/v1/weather/historical")
    assert response.status_code == 200
    assert response.json() == []

def test_get_historical_weather_with_data(client: TestClient, session: Session):
    """Prueba el endpoint de histórico filtrando por fechas con datos simulados."""
    # 1. Preparamos datos simulados en la base de datos de prueba
    record1 = WeatherRecord(estacion="5402", fecha=date(2023, 1, 1), tmax=20.0)
    record2 = WeatherRecord(estacion="5402", fecha=date(2023, 1, 2), tmax=22.0)
    record3 = WeatherRecord(estacion="9999", fecha=date(2023, 1, 1), tmax=15.0) # Otra estación
    session.add(record1)
    session.add(record2)
    session.add(record3)
    session.commit()

    # 2. Hacemos la petición pidiendo solo la estación 5402 en esos días
    response = client.get(
        "/api/v1/weather/historical",
        params={"estacion": "5402", "start_date": "2023-01-01", "end_date": "2023-01-02"}
    )
    
    # 3. Verificamos los resultados
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["tmax"] == 20.0
    assert data[1]["tmax"] == 22.0

def test_get_stations(client: TestClient):
    """Prueba que el endpoint de estaciones devuelve el catálogo correcto."""
    response = client.get("/api/v1/weather/stations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 9
    assert data[0]["id"] == "ANDALUCIA"
    assert data[0]["nombre"] == "Toda Andalucía (Promedio)"
    assert data[1]["provincia"] == "ALMERIA"
