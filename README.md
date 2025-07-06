 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/README.md
index 0000000000000000000000000000000000000000..0e41a73ba7bf97c623be0b3a077e3227ae664027 100644
--- a//dev/null
+++ b/README.md
@@ -0,0 +1,65 @@
+# DUIA - Asistente Educativo
+
+DUIA es una aplicación web que permite generar cuestionarios a partir de archivos PDF y administrar exámenes o entrenamientos para estudiantes. Utiliza Supabase para almacenar preguntas y respuestas y el modelo Gemini de Google para crear preguntas de forma automática.
+
+## Contenido del repositorio
+
+- `inicio.html` – pantalla inicial con la elección de ingresar como **Alumno** o **Profesor**.
+- `alumno.html` – formulario de acceso del alumno donde se registra el nombre y se elige el modo de juego (entrenamiento o examen).
+- `index.html` – interfaz del cuestionario con soporte de voz para leer preguntas y registrar respuestas.
+- `DUIA/clave.html` – ingreso de la clave de profesor (`innoa329`).
+- `profesor-dashboard.html` – panel con enlaces para subir cursos, generar preguntas y revisar analíticas.
+- `subir-curso.html` – permite cargar un listado de alumnos desde un archivo Excel.
+- `DUIA/creador.html` – página para enviar un PDF y obtener posibles preguntas mediante Gemini.
+- `DUIA/resultados.html` – sección de estadísticas y exportación de respuestas.
+- `DUIA/supabase/functions/generar-preguntas/` – función serverless escrita en Deno que contacta la API de Gemini.
+- `test-gemini.js` – script Node que realiza una petición de prueba a Gemini.
+
+## Requisitos
+
+- [Deno](https://deno.land/) para ejecutar la función y comandos de servidor.
+- [Node.js](https://nodejs.org/) si desea usar el script `test-gemini.js`.
+- Un servidor web estático para abrir las páginas HTML (por ejemplo `npx serve` o `python3 -m http.server`).
+- Una clave de API de Google Gemini.
+
+## Configuración
+
+1. Copie `.env.example` a `.env` y asigne su clave a la variable `GEMINI_API_KEY`.
+2. Instale las dependencias necesarias para ejecutar la función o el script de prueba.
+
+```sh
+cp .env.example .env
+# edite `.env` y añada su clave
+```
+
+### Ejecutar la función localmente
+
+```
+deno run --allow-env --allow-net DUIA/supabase/functions/generar-preguntas/index.ts
+```
+
+La función escucha peticiones `POST` con un JSON que contenga `textoPDF` y devuelve un listado de preguntas generadas por Gemini.
+
+### Probar la clave rápidamente
+
+```
+npm install node-fetch@3
+node test-gemini.js
+```
+
+El script imprime en consola la respuesta mínima del API para verificar la validez de la clave.
+
+## Flujo de la aplicación
+
+1. Abra `inicio.html` en su navegador.
+2. Si se ingresa como **Alumno**, complete nombre y apellido y elija **Entrenamiento** o **Examen**.
+   - En *entrenamiento* las preguntas provienen del análisis de un PDF mediante Gemini.
+   - En *examen* se cargan las preguntas que definió el docente y se registran las respuestas con soporte de voz.
+3. Si se ingresa como **Profesor**, introduzca la clave `innoa329`.
+   - Desde el panel del profesor se puede subir un curso desde Excel, generar preguntas desde un PDF, enviar cuestionarios a los alumnos y revisar las analíticas.
+4. Las respuestas y la información de rendimiento se almacenan en Supabase y pueden visualizarse en `DUIA/resultados.html`.
+
+## Despliegue
+
+Puede alojar los archivos HTML y JavaScript en cualquier servicio de hosting estático (GitHub Pages, Vercel, etc.). La función de Deno puede desplegarse en Supabase Edge Functions o Deno Deploy configurando la misma clave de API.
+
 
EOF
)
