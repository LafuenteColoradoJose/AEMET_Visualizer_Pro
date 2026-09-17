"""
Configuración de la conexión a la base de datos.

Este módulo crea el motor de base de datos SQLite y proporciona
la dependencia para inyectar la sesión en los endpoints de FastAPI.
"""
from sqlmodel import create_engine, Session
from collections.abc import Generator

sqlite_file_name = "weather.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def get_session() -> Generator[Session, None, None]:
    """
    Genera una nueva sesión de base de datos.
    
    Se utiliza como dependencia en FastAPI para garantizar que cada
    petición HTTP tenga su propia sesión y la cierre al terminar.
    
    Yields:
        Session: Objeto de sesión de SQLModel.
    """
    with Session(engine) as session:
        yield session
