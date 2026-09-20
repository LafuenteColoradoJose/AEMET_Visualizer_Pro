import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import date
from sqlmodel import Session
from models.weather import WeatherRecord
from services.aemet_service import sync_station_data_bg, safe_float
import httpx

def test_safe_float():
    assert safe_float("12.5") == 12.5
    assert safe_float("12,5") == 12.5
    assert safe_float("") is None
    assert safe_float("abc") is None

@pytest.mark.asyncio
@patch("services.aemet_service.fetch_aemet_data")
@patch("services.aemet_service.date")
async def test_sync_station_data_bg(mock_date, mock_fetch, session: Session):
    mock_date.today.return_value = date(2026, 9, 10)
    mock_date.fromisoformat = date.fromisoformat
    record = WeatherRecord(estacion="5402", fecha=date(2026, 8, 29), tmax=30.0)
    session.add(record)
    session.commit()
    mock_fetch.return_value = [
        {"fecha": "2026-08-30", "indicativo": "5402", "tmax": "35,5", "tmin": "20.1"},
        {"fecha": "2026-08-31", "indicativo": "5402", "tmax": "36,0", "tmin": "21.0"}
    ]
    with patch("services.aemet_service.Session") as mock_session_cls:
        mock_session_cls.return_value.__enter__.return_value = session
        await sync_station_data_bg("5402")
        mock_fetch.assert_called_once_with("5402", date(2026, 8, 30), date(2026, 8, 31))
        from sqlmodel import select
        results = session.exec(select(WeatherRecord).where(WeatherRecord.fecha > date(2026, 8, 29))).all()
        assert len(results) == 2
        assert results[0].fecha == date(2026, 8, 30)

@pytest.mark.asyncio
async def test_fetch_aemet_data_no_api_key():
    from services.aemet_service import fetch_aemet_data
    with patch("services.aemet_service.settings.AEMET_API_KEY", ""):
        result = await fetch_aemet_data("5402", date(2023, 1, 1), date(2023, 1, 2))
        assert result == []

@pytest.mark.asyncio
@patch("services.aemet_service.httpx.AsyncClient.get")
async def test_fetch_aemet_data_error_estado(mock_get):
    from services.aemet_service import fetch_aemet_data
    mock_response = MagicMock()
    mock_response.json.return_value = {"estado": 404, "descripcion": "No hay datos"}
    mock_response.raise_for_status = MagicMock()
    # It must be an async function returning mock_response
    async def mock_get_coro(*args, **kwargs):
        return mock_response
    mock_get.side_effect = mock_get_coro
    
    with patch("services.aemet_service.settings.AEMET_API_KEY", "dummy"):
        result = await fetch_aemet_data("5402", date(2023, 1, 1), date(2023, 1, 2))
        assert result == []

@pytest.mark.asyncio
@patch("services.aemet_service.httpx.AsyncClient.get")
async def test_fetch_aemet_data_exception(mock_get):
    from services.aemet_service import fetch_aemet_data
    mock_get.side_effect = httpx.RequestError("Network error")
    with patch("services.aemet_service.settings.AEMET_API_KEY", "dummy"):
        result = await fetch_aemet_data("5402", date(2023, 1, 1), date(2023, 1, 2))
        assert result == []

@pytest.mark.asyncio
@patch("services.aemet_service.httpx.AsyncClient.get")
async def test_fetch_aemet_data_latin1_fallback(mock_get):
    from services.aemet_service import fetch_aemet_data
    import json
    
    mock_response_1 = MagicMock()
    mock_response_1.json.return_value = {"estado": 200, "datos": "http://fake-url"}
    mock_response_1.raise_for_status = MagicMock()
    
    mock_response_2 = MagicMock()
    # To trigger fallback, json() needs to raise json.JSONDecodeError
    mock_response_2.json.side_effect = json.JSONDecodeError("msg", "doc", 0)
    mock_response_2.content = b'[{"fecha": "2026-08-30", "tmax": "35,5"}]'
    mock_response_2.raise_for_status = MagicMock()
    
    async def side_effect(*args, **kwargs):
        if side_effect.call_count == 0:
            side_effect.call_count += 1
            return mock_response_1
        return mock_response_2
    side_effect.call_count = 0
    
    mock_get.side_effect = side_effect
    
    with patch("services.aemet_service.settings.AEMET_API_KEY", "dummy"):
        result = await fetch_aemet_data("5402", date(2023, 1, 1), date(2023, 1, 2))
        assert len(result) == 1
        assert result[0]["fecha"] == "2026-08-30"

@pytest.mark.asyncio
@patch("services.aemet_service.date")
async def test_sync_station_bg_before_day_5(mock_date):
    from services.aemet_service import sync_station_data_bg
    mock_date.today.return_value = date(2026, 9, 4)
    with patch("services.aemet_service.Session") as mock_session_cls:
        await sync_station_data_bg("5402")
        mock_session_cls.assert_not_called()

@pytest.mark.asyncio
@patch("services.aemet_service.date")
async def test_sync_station_bg_empty_db(mock_date, session: Session):
    from services.aemet_service import sync_station_data_bg
    mock_date.today.return_value = date(2026, 9, 10)
    with patch("services.aemet_service.Session") as mock_session_cls:
        mock_session_cls.return_value.__enter__.return_value = session
        await sync_station_data_bg("5402")

@pytest.mark.asyncio
@patch("services.aemet_service.date")
async def test_sync_station_bg_already_up_to_date(mock_date, session: Session):
    from services.aemet_service import sync_station_data_bg
    mock_date.today.return_value = date(2026, 9, 10)
    mock_date.fromisoformat = date.fromisoformat
    
    record = WeatherRecord(estacion="5402", fecha=date(2026, 8, 31), tmax=30.0)
    session.add(record)
    session.commit()
    
    with patch("services.aemet_service.Session") as mock_session_cls:
        mock_session_cls.return_value.__enter__.return_value = session
        await sync_station_data_bg("5402")

@pytest.mark.asyncio
@patch("services.aemet_service.fetch_aemet_data")
@patch("services.aemet_service.date")
async def test_sync_station_bg_bad_data(mock_date, mock_fetch, session: Session):
    from services.aemet_service import sync_station_data_bg
    mock_date.today.return_value = date(2026, 9, 10)
    mock_date.fromisoformat = date.fromisoformat
    
    session.add(WeatherRecord(estacion="5402", fecha=date(2026, 8, 29)))
    session.commit()
    
    mock_fetch.return_value = [
        {"fecha": "2026-08-29", "indicativo": "5402"},
        {"indicativo": "5402"} 
    ]
    
    with patch("services.aemet_service.Session") as mock_session_cls:
        mock_session_cls.return_value.__enter__.return_value = session
        await sync_station_data_bg("5402")
        from sqlmodel import select
        assert len(session.exec(select(WeatherRecord)).all()) == 1


@pytest.mark.asyncio
@patch("services.aemet_service.fetch_aemet_data")
async def test_backfill_historical_data(mock_fetch, session: Session):
    from services.aemet_service import backfill_historical_data
    # Simulamos descarga de chunks
    async def fake_fetch(est, start, end):
        if start.year == 1983 and start.month == 1:
            return [{"fecha": "1983-01-01", "tmax": "15.0"}]
        elif start.year == 1983 and start.month == 6:
            return [{"fecha": "1983-12-31", "tmax": "10.0"}]
        return []
        
    mock_fetch.side_effect = fake_fetch
    
    records = await backfill_historical_data(session, "5402", date(1983,1,1), date(1983,12,31))
    
    assert len(records) == 2
    assert records[0].fecha == date(1983, 1, 1)
    assert records[1].fecha == date(1983, 12, 31)

@pytest.mark.asyncio
@patch("services.aemet_service.fetch_aemet_data")
async def test_backfill_historical_data_empty(mock_fetch, session: Session):
    from services.aemet_service import backfill_historical_data
    # Simulamos error de AEMET que devuelve []
    mock_fetch.return_value = []
    
    # Pre-poblamos un registro
    session.add(WeatherRecord(estacion="5402", fecha=date(1983, 1, 1), tmax=20.0))
    session.commit()
    
    records = await backfill_historical_data(session, "5402", date(1983,1,1), date(1983,12,31))
    
    # Debe devolver lo que había en base de datos sin borrarlo
    assert len(records) == 1
    assert records[0].tmax == 20.0
