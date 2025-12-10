# 🏛️ Pensum Planner

**Planificador Académico Cuatrimestral Modular**

[![Estado del Proyecto](https://img.shields.io/badge/Estado-Activo-brightgreen)](URL_DEL_REPOSITORIO)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue.svg)](LICENSE.md)

Pensum Planner es una herramienta web modular y de código abierto (Open Source) diseñada para ayudar a los estudiantes a **organizar su plan de estudios (Pensum)** en un formato cuatrimestral flexible.

El objetivo principal es tomar la malla curricular estática de una carrera (como las ofrecidas por la UTESA) y transformarla en una **planificación dinámica y editable** que:

* Permita arrastrar y soltar asignaturas entre cuatrimestres.
* Valide automáticamente el cumplimiento de los prerrequisitos.
* Calcule los créditos totales por período y por plan.
* Facilice la planificación a largo plazo y la toma de decisiones informadas sobre la carga académica.

Esta versión está optimizada y probada con los planes de estudio de la Universidad Tecnológica de Santiago (**UTESA**), pero es adaptable a cualquier pensum cuatrimestral con estructura similar.

### 💡 Características

* **Planificación Drag & Drop:** Arrastre y suelte asignaturas fácilmente entre cuatrimestres.
* **Validación de Prerrequisitos:** Alertas visuales que indican si una materia se coloca sin cumplir sus requisitos previos.
* **Contador de Créditos:** Resumen automático de créditos matriculados por cuatrimestre.
* **Importación de Pensum:** Carga de datos mediante archivos JSON estandarizados (ideal para pensums estructurados).
* **Exportación a PDF:** Generación de un resumen del plan académico personalizado en formato PDF de alta calidad.
* **Tecnología:** Desarrollado completamente con **Vanilla JavaScript**, HTML y CSS, sin dependencias de frameworks complejos.

### 🏗️ Arquitectura y Stack Tecnológico

El proyecto está diseñado siguiendo una arquitectura modular basada en el patrón Modelo-Vista-Controlador (MVC) simplificado, utilizando únicamente herramientas nativas del navegador.

| Componente | Tecnología/Lenguaje | Propósito Principal |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 | Interfaz de usuario dinámica y manipulación del DOM. |
| **Estado** | `state.js` | Manejo centralizado e inmutable del estado del planificador y los datos del pensum. |
| **Lógica Central** | `/algorithm/plannerCore.js` | Contiene la lógica de negocio para la validación de prerrequisitos y cálculos de créditos. |
| **Datos** | JSON | Utiliza un formato JSON estandarizado para la importación del pensum (ver `pensum-2016.json`). |

### 🚀 Cómo Usarlo

Simplemente acceda al demo alojado en GitHub Pages para empezar a planificar su pensum:

[**Ir al Pensum Planner**](https://hesedev.github.io/pensum-planner/)

#### B. Desarrollo Local (Open Source)

Si desea contribuir o ejecutar el proyecto localmente:

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Hesedev/pensum-planner.git](https://github.com/Hesedev/pensum-planner.git)
    cd pensum-planner
    ```
2.  **Abrir `index.html`:**
    Dado que es un proyecto Vanilla JS, no requiere un paso de compilación (`npm install`). Simplemente abra el archivo `index.html` en su navegador web o use una extensión de servidor local (como Live Server en VS Code).

    ### 🤝 Contribución

¡Este proyecto es Open Source y agradecemos cualquier tipo de colaboración! Si encuentras un error, tienes una sugerencia, o quieres mejorar la lógica de validación, por favor:

1.  Abre un *Issue* describiendo el problema o la característica deseada.
2.  Crea un *Fork* del proyecto.
3.  Implementa tus cambios en una nueva rama.
4.  Envía un *Pull Request* claro.

---

**Estamos especialmente interesados en:**
* Mejorar el algoritmo de validación.
* Adaptar el sistema a otros pensums cuatrimestrales.
* Mejoras en la accesibilidad y el diseño (CSS).

### 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE.md](LICENSE.md) para más detalles.