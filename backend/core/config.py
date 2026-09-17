from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    AEMET_API_KEY: str = ""
    
    # Busca un archivo .env en la ruta desde la que se ejecute la aplicación
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
