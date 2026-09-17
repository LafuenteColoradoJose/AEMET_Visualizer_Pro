# Manual Técnico - AEMET Visualizer Pro

Este documento describe las decisiones arquitectónicas, configuración del entorno y directrices de desarrollo para el proyecto AEMET Visualizer Pro.

## 1. Estructura del Monorepo

El proyecto utiliza una estructura de monorepo para facilitar la sincronización entre los cambios de la API (backend) y la interfaz de usuario (frontend).

```text
AEMET_Visualizer_Pro/
├── backend/            # API REST (FastAPI) y scripts de procesamiento
├── frontend/           # Aplicación Web SPA (Angular)
├── .gitignore          # Reglas de exclusión de Git globales
├── README.md           # Documentación principal
└── MANUAL_TECNICO.md   # Documentación técnica (este archivo)
```

## 2. Backend (Python + FastAPI)

### 2.1. Gestión de Entorno y Dependencias
Se utilizará un entorno virtual de Python (`.venv` o `venv`) ubicado dentro de la carpeta `backend/`. 
Las dependencias principales incluirán:
- `fastapi`: Framework web para la API.
- `uvicorn`: Servidor ASGI para ejecutar FastAPI.
- `pandas` / `requests`: Para el procesamiento y descarga de datos de la AEMET.

### 2.2. Flujo de Datos
1. Ejecución de scripts automatizados para extraer datos crudos de la AEMET.
2. Limpieza de datos y almacenamiento (CSV/JSON/BD).
3. FastAPI expone endpoints (ej. `/api/v1/temperaturas`) que el frontend consumirá.

## 3. Frontend (Angular)

### 3.1. Stack Tecnológico
- **Framework:** Angular.
- **Estilos:** TailwindCSS para un desarrollo rápido y responsivo.
- **Visualización de Datos:** Apache ECharts o ApexCharts para renderizar series temporales meteorológicas.

### 3.2. Arquitectura de Componentes
- Se crearán servicios dedicados en Angular para gestionar las peticiones HTTP hacia el backend (FastAPI).
- Los componentes visuales serán modulares (ej. `TemperatureChartComponent`, `RainfallMapComponent`).

## 4. Control de Versiones (Git)
Se recomienda seguir el estándar de *Conventional Commits* (ej. `feat: añade endpoint de lluvia`, `fix: corrige error en gráfica de temperatura`). El despliegue de ambas partes podrá automatizarse en plataformas modernas configurando los comandos de build por directorio (`/backend` y `/frontend`).
