# Manual Técnico - AEMET Visualizer Pro

Este documento describe las decisiones arquitectónicas, configuración del entorno y directrices de desarrollo para el proyecto AEMET Visualizer Pro.

## 1. Estructura del Monorepo

El proyecto utiliza una estructura de monorepo para facilitar la sincronización entre los cambios de la API (backend) y la interfaz de usuario (frontend).

```text
AEMET_Visualizer_Pro/
├── backend/            # API REST (FastAPI), Base de datos (PostgreSQL/SQLite) y Tests
├── frontend/           # Aplicación Web SPA (Angular)
├── .gitignore          
├── README.md           
└── MANUAL_TECNICO.md   
```

## 2. Backend (Python + FastAPI)

### 2.1. Gestión de Entorno y Dependencias
Se utiliza un entorno virtual de Python (`.venv`) en `/backend`. 
Dependencias principales (`requirements.txt`):
- `fastapi[standard]`: Framework web y servidor Uvicorn.
- `sqlmodel`: ORM moderno basado en Pydantic y SQLAlchemy para interactuar con SQLite.
- `pandas` / `requests`: Para la ingesta y limpieza del *Data Wrangling* desde la AEMET.
- `pytest` / `pytest-cov`: Para la suite de pruebas y métricas de cobertura.

### 2.2. Flujo de Datos y Caché (SQLite)
Para evitar saturar la API oficial de la AEMET y garantizar un rendimiento óptimo en el frontend, se ha implementado la siguiente arquitectura de datos:
1. **Extracción y Limpieza**: Los scripts originales de Machine Learning descargan la información por rangos (manejando errores `429` de AEMET). Usando Pandas, se realiza el *forward fill* para nulos y se parsean correctamente las variables decimales.
2. **Reconstrucción Histórica (Data Backfilling)**: Para garantizar series climáticas continuas e ininterrumpidas desde 1950 en toda Andalucía, se implementaron rutinas de empalme que recuperan los datos de las estaciones legacy ya clausuradas (ej: `4605` en Huelva, `5270` en Jaén, `6297` en Almería) y los asocian en base de datos a los indicativos de las estaciones modernas (`4642E`, `5270B`, `6325O`), resolviendo las discontinuidades inherentes al sistema de inventario de AEMET.
3. **Almacenamiento (Persistencia Híbrida)**: Los datos limpios se insertan en una base de datos **PostgreSQL** en la nube (producción) o en SQLite (`weather.db`) para desarrollo local, utilizando la variable de entorno `DATABASE_URL`.
4. **Consulta (API)**: Cuando el frontend de Angular solicita datos, el servicio (`services/aemet_service.py`) consulta directamente la base de datos, devolviendo JSON limpios en fracciones de segundo.

### 2.3. Pruebas Unitarias y Calidad (QA)
El backend se rige bajo una filosofía estricta de calidad:
- **TDD y Cobertura al 100%**: Existe una suite en `/tests` que levanta una base de datos SQLite en memoria (aislada) para validar los endpoints usando `TestClient`. El umbral mínimo aceptado de cobertura es del 100%.
- **Documentación de Código**: Todo el código de producción (`routers`, `services`, `models`, `core`) incluye *Docstrings* siguiendo el estándar de Google (PEP 257) detallando `Args`, `Returns` y la funcionalidad del módulo.

### 2.4. Inteligencia Artificial (MLPRegressor y Residual Forecasting)
El proyecto incluye un motor predictivo basado en Redes Neuronales Artificiales (Multilayer Perceptron). Para lograr precisión tanto a corto como a largo plazo con un único modelo, se ha diseñado una arquitectura de **Pronóstico de Anomalías (Residual Forecasting)**:
1. **Entrenamiento (Python)**: El script `train_weather_model.py` extrae las medias históricas diarias y calcula la anomalía de cada registro. El modelo se entrena para predecir la anomalía objetivo en base a 25 entradas (Seno/Coseno del día, 8 estaciones One-Hot, y 15 variables de *lag* correspondientes a la anomalía de los 5 días previos). Los pesos finales se exportan a un `model-weights.json`.
2. **Inferencia Aislada (Angular)**: El frontend decodifica el JSON y ejecuta las multiplicaciones de matrices de la red neuronal enteramente en el navegador del cliente mediante el servicio `AiPredictionService`.
3. **Fallback Híbrido**: Al usar anomalías como *lags*, si la aplicación pide una predicción a 10 años vista (donde no hay historial previo), el servicio inyecta `0` como anomalía. Matemáticamente, esto desactiva el peso de los 5 días previos y permite que la red emita el promedio histórico base de forma estable.

## 3. Frontend (Angular 22)

### 3.1. Stack Tecnológico y Arquitectura
- **Framework:** Angular 22 utilizando **Standalone Components**, el nuevo Control Flow (`@if`, `@for`) y **Signals** (`signal()`, `computed()`) para un estado reactivo ultra-rápido y sin dependencias de RxJS cuando no es estrictamente necesario. Se sigue una arquitectura de carpetas por módulos funcionales (`core`, `shared`, `features`).
- **Diseño y Maquetación:** Se emplea **SCSS** puro apoyado en **CSS Grid** (`.dashboard-grid`). El diseño es **panorámico a dos columnas** en escritorio para evitar el *scroll vertical*, colapsando fluidamente a una sola columna en pantallas estrechas.
- **Modo Oscuro Nivel Sistema:** Integración de Dark Mode gestionado de forma reactiva (`theme.service.ts`). Escucha activamente `window.matchMedia('(prefers-color-scheme: dark)')` y persiste la preferencia local. Utiliza variables CSS y una paleta de 5 colores exactos (Gris oscuro, Azul Eléctrico, Gris medio, Verde Menta, Blanco/Negro) compartida en toda la app.
- **Visualización de Datos:** **Apache ECharts** (`ngx-echarts`). Las gráficas se adaptan automáticamente a cambios de ventana y alternan sus esquemas de color entre `dark` y el modo claro usando un `ResizeObserver`. Componentes construidos hasta la fecha:
  - Gráficos de Líneas y Área (Visión General de Temperatura).
  - Componentes estadísticos tipo *Cards* (Días de Lluvia).
  - Mapas de Calor tipo Calendario (Análisis Anual de Temperatura Máxima).
  - Gráficos Polares y Radiales (Análisis Anual de Precipitación por meses).
  - **Prediction Playground**: Gráfico de nodos que dibuja dinámicamente y en tiempo real la topología de la Red Neuronal (capas ocultas, pesos y activaciones) integrando selectores de fecha nativos de Angular Material.

### 3.2. Estrategia de Testing (Vitest)
A diferencia de proyectos tradicionales en Angular con Jasmine/Karma, AEMET Visualizer Pro ha migrado al experimental `@angular/build:unit-test` respaldado internamente por **Vitest**:
- **Ejecución de Tests:** Los tests corren en Node mediante `JSDOM`. No requieren levantar un navegador headless.
- **Mocks Nativos:** Dado que JSDOM carece de ciertas APIs de navegador moderno, se ha implementado un parche global (`src/setup-vitest.ts`) inyectado desde `angular.json` para mockear correctamente `window.matchMedia` y `ResizeObserver`.
- **Cobertura Rigurosa:** De manera análoga al backend, se mockean las peticiones HTTP con `HttpTestingController` para probar exhaustivamente las *Signals* y la renderización en el HTML. Se persigue la máxima cobertura en todos los componentes y servicios (Global +89%).

## 4. Control de Versiones (Git)
Se recomienda seguir el estándar de *Conventional Commits* (ej. `feat: añade endpoint de lluvia`, `fix: corrige error en gráfica de temperatura`). La base de datos local de SQLite (`weather.db`) ha sido subida en el *commit* fundacional para facilitar la configuración inicial rápida de nuevos desarrolladores.

## 5. Arquitectura de Despliegue (Producción)

El proyecto AEMET Visualizer Pro ha sido diseñado para operar bajo un ecosistema de nube distribuida que maximiza el rendimiento y minimiza costes, esquivando las limitaciones tradicionales de las plataformas *Serverless*.

### 5.1. Vercel (Frontend SPA)
El código de Angular se compila (`@angular/build:application`) y se despliega en Vercel. 
- **Configuración de Enrutamiento**: Dado que Angular 17+ compila en `dist/frontend/browser`, se ha añadido un archivo `vercel.json` personalizado en la raíz del frontend para garantizar que los *rewrites* de las rutas redirigen correctamente al `index.html` (SPA Routing) y no devuelven errores `404`.
- **API URL**: El frontend apunta a la URL pública del backend en Render.

### 5.2. Render (Backend FastAPI)
A diferencia del frontend, el backend **no** se despliega en Vercel Serverless Functions. El motivo técnico es que el plan gratuito de Vercel (Hobby) finaliza forzosamente las funciones a los 10 segundos. Dado que el backend utiliza `BackgroundTasks` para conectarse a la AEMET y descargar meses históricos enteros bajo demanda, el proceso se interrumpiría.
Se utiliza Render (Web Service) en la región de Frankfurt (EU) para ejecutar el servidor ASGI (Uvicorn) en un contenedor ininterrumpido.

### 5.3. Neon (PostgreSQL Serverless)
La persistencia de datos históricos (+198,000 registros) ha sido migrada desde el SQLite local a un clúster de **PostgreSQL Serverless** alojado en Neon (región Frankfurt).
- **Gestión Dinámica de URL**: FastAPI lee la variable de entorno `DATABASE_URL`. Si detecta una cadena `postgresql://`, se conecta nativamente utilizando el driver `psycopg2-binary`. En caso contrario (desarrollo local), revierte de manera segura a `sqlite:///weather.db`.
- **CORS**: El backend está estrictamente securizado para aceptar peticiones origen (`Access-Control-Allow-Origin`) de `localhost` y del dominio de producción (`*.vercel.app`).
