from core.config import settings

def test_settings_loaded():
    """Verifica que la configuración se carga correctamente desde pydantic-settings."""
    # Como no tenemos el .env real en testing (o está vacío),
    # simplemente comprobamos que el atributo existe.
    assert hasattr(settings, "AEMET_API_KEY")
