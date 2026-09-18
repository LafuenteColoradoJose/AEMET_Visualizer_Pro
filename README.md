# AEMET Visualizer Pro

Bienvenido a **AEMET Visualizer Pro**, una herramienta avanzada para la descarga, procesamiento y visualización interactiva de datos meteorológicos extraídos de la Agencia Estatal de Meteorología (AEMET).

## 🚀 Arquitectura del Proyecto

Este proyecto está construido como un **Monorepo** que aloja dos aplicaciones principales fuertemente tipadas y testeadas:

*   **`backend/`**: Desarrollado en **Python** con **FastAPI** y **SQLModel**.
    *   **Base de Datos**: Utiliza una base de datos local **SQLite** (`weather.db`) para almacenar el histórico meteorológico (actualmente pre-cargado con más de 22.000 registros). Esto garantiza respuestas en milisegundos.
    *   **Calidad**: Sigue los estándares más altos de la industria con inyección de dependencias pura, un **100% de cobertura en tests unitarios** (vía `pytest`) y documentación exhaustiva (Docstrings PEP 257).
*   **`frontend/`**: Aplicación Web **Angular 22** (SPA) que consume la API para presentar el dashboard interactivo. 
    *   **Diseño**: Utiliza **SCSS** con CSS Grid para un diseño panorámico a dos columnas (sin scroll vertical en escritorio) y soporte nativo para **Modo Oscuro**.
    *   **Gráficos**: Integra **Apache ECharts** (`ngx-echarts`) para visualizaciones avanzadas (Líneas, Heatmap de Calendario, Barras Polares).
    *   **Calidad**: Mantiene una cobertura de pruebas excepcional mediante **Vitest** y entornos JSDOM.

## 🛠️ Requisitos Previos

Para ejecutar este proyecto en tu máquina local, necesitarás tener instalado:

*   [Python 3.12+](https://www.python.org/downloads/)
*   [Node.js y npm](https://nodejs.org/) (Versión 18 o superior)
*   [Angular CLI](https://angular.dev/tools/cli) (`npm install -g @angular/cli`)
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

Para ejecutar la suite de pruebas unitarias del backend:
```bash
pytest tests/ --cov=./
```

## 🌐 Desarrollo del Frontend

Para arrancar la interfaz visual en entorno local:

```bash
cd frontend
# Instalar dependencias si es la primera vez: npm install
npm run start
```
El dashboard web estará disponible en `http://localhost:4200`.

Para ejecutar la suite de pruebas unitarias del frontend (Vitest):
```bash
npm run test -- --coverage
```
