"""
Configuración centralizada del entorno.

Utiliza pydantic_settings para cargar de forma segura las variables
de entorno desde el archivo .env, garantizando su tipado.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Clase que define las variables de entorno necesarias para la aplicación.
    
    Attributes:
        AEMET_API_KEY (str): La clave de la API de la AEMET.
    """
    AEMET_API_KEY: str = ""
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
