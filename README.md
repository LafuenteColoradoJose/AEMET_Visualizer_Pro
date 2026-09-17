# AEMET Visualizer Pro

Bienvenido a **AEMET Visualizer Pro**, una herramienta avanzada para la descarga, procesamiento y visualización interactiva de datos meteorológicos extraídos de la Agencia Estatal de Meteorología (AEMET).

## 🚀 Arquitectura del Proyecto

Este proyecto está construido como un **Monorepo** que aloja dos aplicaciones principales fuertemente tipadas y testeadas:

*   **`backend/`**: Desarrollado en **Python** con **FastAPI** y **SQLModel**.
    *   **Base de Datos**: Utiliza una base de datos local **SQLite** (`weather.db`) para almacenar el histórico meteorológico (actualmente pre-cargado con más de 22.000 registros). Esto garantiza respuestas en milisegundos.
    *   **Calidad**: Sigue los estándares más altos de la industria con inyección de dependencias pura, un **100% de cobertura en tests unitarios** (vía `pytest`) y documentación exhaustiva (Docstrings PEP 257).
*   **`frontend/`**: (En desarrollo) Aplicación **Angular** que consumirá la API del backend para presentar los datos meteorológicos mediante dashboards interactivos utilizando **TailwindCSS** y gráficos avanzados (ECharts/ApexCharts).

## 🛠️ Requisitos Previos

Para ejecutar este proyecto en tu máquina local, necesitarás tener instalado:

*   [Python 3.12+](https://www.python.org/downloads/)
*   [Node.js y npm](https://nodejs.org/)
*   [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)
*   [Git](https://git-scm.com/)

## 💻 Desarrollo del Backend

Para arrancar la API en entorno local:

```bash
cd backend
source .venv/bin/activate
# Instalar dependencias si es la primera vez: pip install -r requirements.txt
fastapi dev main.py
```
El servidor interactivo Swagger estará disponible en `http://127.0.0.1:8000/docs`.

Para ejecutar la suite de pruebas unitarias:
```bash
pytest tests/ --cov=./
```
