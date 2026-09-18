# Manual Técnico - AEMET Visualizer Pro

Este documento describe las decisiones arquitectónicas, configuración del entorno y directrices de desarrollo para el proyecto AEMET Visualizer Pro.

## 1. Estructura del Monorepo

El proyecto utiliza una estructura de monorepo para facilitar la sincronización entre los cambios de la API (backend) y la interfaz de usuario (frontend).

```text
AEMET_Visualizer_Pro/
├── backend/            # API REST (FastAPI), Base de datos SQLite y Tests
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
2. **Almacenamiento (Caché local)**: Los datos limpios se insertan en una base de datos local SQLite (`weather.db`).
3. **Consulta (API)**: Cuando el frontend de Angular solicita datos, el servicio (`services/aemet_service.py`) consulta directamente la tabla optimizada de SQLite, devolviendo JSON limpios en fracciones de segundo.

### 2.3. Pruebas Unitarias y Calidad (QA)
El backend se rige bajo una filosofía estricta de calidad:
- **TDD y Cobertura al 100%**: Existe una suite en `/tests` que levanta una base de datos SQLite en memoria (aislada) para validar los endpoints usando `TestClient`. El umbral mínimo aceptado de cobertura es del 100%.
- **Documentación de Código**: Todo el código de producción (`routers`, `services`, `models`, `core`) incluye *Docstrings* siguiendo el estándar de Google (PEP 257) detallando `Args`, `Returns` y la funcionalidad del módulo.

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

### 3.2. Estrategia de Testing (Vitest)
A diferencia de proyectos tradicionales en Angular con Jasmine/Karma, AEMET Visualizer Pro ha migrado al experimental `@angular/build:unit-test` respaldado internamente por **Vitest**:
- **Ejecución de Tests:** Los tests corren en Node mediante `JSDOM`. No requieren levantar un navegador headless.
- **Mocks Nativos:** Dado que JSDOM carece de ciertas APIs de navegador moderno, se ha implementado un parche global (`src/setup-vitest.ts`) inyectado desde `angular.json` para mockear correctamente `window.matchMedia` y `ResizeObserver`.
- **Cobertura Rigurosa:** De manera análoga al backend, se mockean las peticiones HTTP con `HttpTestingController` para probar exhaustivamente las *Signals* y la renderización en el HTML. Se persigue la máxima cobertura en todos los componentes y servicios (Global +89%).

## 4. Control de Versiones (Git)
Se recomienda seguir el estándar de *Conventional Commits* (ej. `feat: añade endpoint de lluvia`, `fix: corrige error en gráfica de temperatura`). La base de datos local de SQLite (`weather.db`) ha sido subida en el *commit* fundacional para facilitar la configuración inicial rápida de nuevos desarrolladores.
