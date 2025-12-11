# 🎓 Pensum Planner

![Logo del Pensum Planner](assets/logo.png)

**Pensum Planner** es una herramienta de planificación académica inteligente diseñada para ayudar a los estudiantes universitarios a optimizar su trayectoria de estudio. El sistema permite al estudiante **organizar de forma inteligente** su carrera, generando automáticamente el plan de materias más eficiente para completarla en el menor tiempo posible, respetando estrictamente todas las dependencias académicas.

---

## 🚀 Características Esenciales

Pensum Planner ofrece las herramientas clave para la organización académica:

* **Planificación Óptima:** Genera la secuencia de ciclos más eficiente basándose en el historial de materias aprobadas y los límites de créditos/asignaturas por ciclo.
* **Gestión de Dependencias:** Soporte completo para la validación de prerrequisitos, correquisitos y reglas especiales de las materias.
* **Editor de Pensums:** Permite cargar, crear y editar pensums completos, gestionando ciclos, materias y electivas.
* **Portabilidad:** Importación y exportación de pensums en formato **JSON** para un fácil intercambio.
* **Documentación:** Exportación del plan de estudio generado a un archivo **PDF** de alta calidad.

---

## 💡 Alcance y Compatibilidad

### Enfoque

Este proyecto fue desarrollado y está **especialmente optimizado** para el uso en la **Universidad Tecnológica de Santiago (UTESA)**, sin embargo, la herramienta es flexible y se puede adaptar a otras instituciones.

### Compatibilidad

El planificador puede generar rutas académicas para pensums que utilicen cualquier tipo de ciclo de estudio (semestral, trimestral o cuatrimestral), siempre y cuando la estructura del plan de estudios se ajuste al formato de importación de la aplicación.

* **Periodo Cuatrimestral:** Se usa por defecto si el pensum no especifica el tipo de ciclo.
* **Otros Periodos:** Si el pensum importado especifica explícitamente un ciclo (semestral o trimestral), el planificador ajustará automáticamente los cálculos a esa duración.

---

## 📚 Biblioteca de Pensums

Con el objetivo de ser una herramienta impulsada por la comunidad, este repositorio incluye la carpeta `/data/pensums` (no incluida inicialmente en el repositorio, pero es la ruta recomendada), que sirve como una biblioteca de planes de estudio listos para usar, aportados por los usuarios.

Si tu pensum aún no está disponible, puedes:

1.  Usar la herramienta de edición para crearlo e importarlo tú mismo.
2.  **¡Contribuir!** Envía un Pull Request con el archivo JSON de tu pensum a la carpeta `/data/pensums` para ayudar a otros estudiantes.

---

## 🛠️ Cómo Empezar

Pensum Planner es una aplicación **Vanilla JavaScript** que puede ser usada directamente desde la web o ejecutada localmente.

### 1. Uso Directo (Recomendado para Usuarios)

Puedes usar la herramienta sin instalar nada, directamente en tu navegador, gracias a GitHub Pages:

🔗 **[Abrir Pensum Planner en vivo](https://hesedev.github.io/pensum-planner/)**

### 2. Ejecución Local (Para Contribuyentes)

Si deseas modificar el código o desarrollar nuevas funcionalidades:

1.  **Clona el repositorio:**
    ```bash
    git clone [[https://github.com/tu-usuario/pensum-planner.git](https://github.com/tu-usuario/pensum-planner.git)]
    ```
2.  **Ejecución:** Simplemente abre el archivo `index.html` en tu navegador.
    > **Nota:** Para que las funciones de importar y exportar archivos funcionen correctamente, se recomienda usar un servidor local simple (ej. Live Server).

---

## 📝 Guía de Uso Rápido

Sigue estos pasos sencillos para generar tu plan de estudios optimizado:

### Paso 1: Seleccionar el Pensum
En la sección "Configuración del plan", selecciona el pensum de la lista desplegable. Si tu pensum aún no está cargado, puedes usar el **Editor de Pensums** para importarlo o crearlo manualmente.

### Paso 2: Definir Restricciones y Periodo de Inicio
Antes de ejecutar el plan, ajusta los límites en la parte superior:
* Máx. materias que quieres tomar por ciclo.
* Máx. créditos por ciclo.
* El Ciclo y Año de inicio de tu planificación.

### Paso 3: Configurar las Materias Aprobadas
Una vez seleccionado el pensum, se cargarán todos los ciclos. Debes:
1. Marcar todas las materias **obligatorias** que ya has aprobado.
2. Si tu pensum tiene electivas, gestiona las **electivas aprobadas** y las **electivas que deseas incluir** en el plan. El contador te mostrará el total de créditos de electivas seleccionadas.

### Paso 4: Generar y Visualizar el Plan
Haz clic en el botón **"Generar Plan"**. El sistema ejecutará el algoritmo y te mostrará el resultado:
* El plan se desglosa ciclo por ciclo, con la fecha de inicio estimada para cada uno.
* Cada materia listada en el plan cumple con todos sus prerrequisitos y correquisitos definidos.

Si deseas guardar el resultado, haz clic en **"Descargar PDF"** para obtener una copia de alta calidad.

---

## 🤝 Contribuciones (Open Source)

Este es un proyecto *open source*. Damos la bienvenida a la comunidad para:

1.  Reportar errores o sugerir mejoras en la sección de [Issues](https://github.com/Hesedev/pensum-planner/issues).
2.  Contribuir código para ampliar la funcionalidad, mejorar el algoritmo o subir un nuevo pensum compatible a la Biblioteca.

---

## 🧑‍💻 Autor

* **Hesedev** - [https://github.com/Hesedev](https://github.com/Hesedev)

---

## 📜 Licencia

Este proyecto está distribuido bajo la licencia **MIT**.