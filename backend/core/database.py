from sqlmodel import create_engine, Session

# Archivo de base de datos local
sqlite_file_name = "weather.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# check_same_thread=False es necesario en FastAPI cuando usamos SQLite
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

# Inyección de dependencias para FastAPI
def get_session():
    with Session(engine) as session:
        yield session
