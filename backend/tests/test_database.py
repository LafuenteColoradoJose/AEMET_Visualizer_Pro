from core.database import get_session

def test_get_session():
    """Prueba que el generador get_session produce una sesión de SQLAlchemy/SQLModel."""
    generator = get_session()
    session = next(generator)
    assert session is not None
    
    # Cerramos el generador para que ejecute el código de limpieza del yield
    try:
        next(generator)
    except StopIteration:
        pass
