"""
Configuración de la conexión a la base de datos.

Este módulo crea el motor de base de datos a partir de la URL
proporcionada en las variables de entorno (SQLite local o Postgres remoto).
"""
from sqlmodel import create_engine, Session
from collections.abc import Generator
from core.config import settings

# Si la base de datos es Postgres (URL de Vercel/Neon suele ser postgres:// o postgresql://)
# SQLAlchemy prefiere postgresql://
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
# check_same_thread solo es necesario y soportado por SQLite
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args)

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
