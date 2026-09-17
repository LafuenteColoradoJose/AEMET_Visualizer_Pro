# AEMET Visualizer Pro

Bienvenido a **AEMET Visualizer Pro**, una herramienta avanzada para la descarga, procesamiento y visualización interactiva de datos meteorológicos extraídos de la Agencia Estatal de Meteorología (AEMET).

## 🚀 Arquitectura del Proyecto

Este proyecto está construido como un **Monorepo** que aloja dos aplicaciones principales:

*   **`backend/`**: Desarrollado en **Python** con **FastAPI**. Se encarga de conectarse a la API de la AEMET, descargar los datos, limpiarlos/procesarlos (usando Pandas) y servirlos a través de endpoints RESTful.
*   **`frontend/`**: Desarrollado en **Angular**. Consume la API del backend para presentar los datos meteorológicos mediante dashboards interactivos utilizando **TailwindCSS** para el diseño y **ECharts / ApexCharts** para las gráficas.

## 🛠️ Requisitos Previos

Para ejecutar este proyecto en tu máquina local, necesitarás tener instalado:

*   [Python 3.8+](https://www.python.org/downloads/)
*   [Node.js y npm](https://nodejs.org/)
*   [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)
*   [Git](https://git-scm.com/)

---
*Nota: Este proyecto está actualmente en fase de inicialización.*
