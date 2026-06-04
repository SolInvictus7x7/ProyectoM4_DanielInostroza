# Deploy: https://proyecto-m4-daniel-inostroza.vercel.app

# TODO List Grupal

## Descripción del Proyecto
Este proyecto es una aplicación web colaborativa de administración de tareas (TODO List) organizadas por grupos de trabajo. La plataforma permite a los usuarios registrarse e iniciar sesión de manera segura, crear o unirse a grupos de tareas, administrar tareas de forma individual o asignarlas a miembros del equipo, y enviar resúmenes por correo electrónico de las tareas del grupo.

## Decisiones Arquitectónicas
El flujo de datos y la interacción entre el cliente React y Cloud Firestore se rige bajo los siguientes diseños lógicos para sus módulos principales:

### 1. Gestión de Grupos ("Mis Grupos")
- **Consulta de Pertenencia**: Para mostrar la lista de grupos, el cliente ejecuta una consulta en la colección `groups` de Firestore filtrando mediante la condición `where('members', 'array-contains', user.uid)`. Esto asegura que el usuario solo visualice los espacios de trabajo a los que pertenece.
- **Creación de Grupos**: Al crear un grupo, se inicializa un documento en la colección `groups` que almacena un identificador único (`gid`), el nombre del grupo, una lista de administradores (`admin-uid`) inicializada con el UID del creador, y la lista de miembros (`members`) que inicialmente contiene al creador.

### 2. Tareas de un Grupo ("Tareas del Grupo")
- **Carga de Tareas**: Al entrar en el detalle de un grupo específico, el sistema consulta la colección `tasks` buscando todos los documentos cuyo campo `assigned-to` coincida con el identificador del grupo (`gid`).
- **Administración Privilegiada**: Las acciones de creación, modificación de título/descripción, asignación de miembros y eliminación de tareas están restringidas en base a si el UID del usuario está registrado en el array `admin-uid` de la colección del grupo. Esto es validado tanto a nivel de interfaz de usuario como por las reglas de seguridad de Firestore.

### 3. Vista de Tareas Personales ("Mis Tareas")
Esta vista unifica el trabajo del usuario a través de todos sus grupos mediante un proceso de consulta y filtrado en dos fases:
- **Fase 1 (Obtención de datos)**: Primero, la aplicación recupera la lista de grupos a los que pertenece el usuario. Luego, ejecuta una consulta en la colección `tasks` para traer todas las tareas pertenecientes a esos grupos específicos utilizando un filtro de pertenencia (`assigned-to in groupIds`).
- **Fase 2 (Filtrado de asignaciones)**: Una vez obtenidas las tareas en memoria, el cliente filtra el listado para presentar únicamente las tareas que corresponden al usuario:
  - Tareas grupales globales (donde el array `members` de la tarea está vacío, lo que indica que es visible y realizable por cualquier integrante del grupo).
  - Tareas específicamente asignadas (donde el array `members` de la tarea incluye el UID del usuario).
  - Finalmente, las tareas filtradas se agrupan visualmente por su respectivo grupo en la interfaz.

### 4. Generación y Captura de IDs en Firestore (gid y tid)
Para evitar múltiples peticiones de red (por ejemplo, guardar un documento para que Firestore genere un ID y luego actualizar el documento para registrar ese mismo ID en sus campos), la aplicación emplea una técnica de pre-generación en el cliente:
- **Pre-generación de la Referencia**: Al crear un grupo o una tarea, el frontend ejecuta `doc(collection(db, 'groups'))` o `doc(collection(db, 'tasks'))` sin pasar un ID específico. Esto le indica a la librería cliente de Firestore que genere de forma local una referencia con un identificador único en su propiedad `.id`.
- **Asignación local**: El valor de `newGroupRef.id` o `taskRef.id` se "atrapa" en el cliente y se asigna al atributo `gid` (Group ID) o `tid` (Task ID) dentro del payload de datos.
- **Guardado atómico**: Finalmente, se almacena el documento usando `setDoc(ref, data)`. De esta forma, el documento se guarda directamente con el ID autogenerado de Firebase y su contenido incluye internamente dicho identificador, facilitando el filtrado y las consultas en el cliente sin realizar peticiones redundantes.

## Variables de Entorno Necesarias
Para que el proyecto funcione de forma local y en producción, se deben proveer las siguientes variables de entorno en un archivo `.env`:

### Configuración de Firebase (Frontend)
- `VITE_FIREBASE_API_KEY`: Clave de API pública de tu proyecto de Firebase.
- `VITE_FIREBASE_AUTH_DOMAIN`: Dominio de autenticación de tu aplicación de Firebase.
- `VITE_FIREBASE_PROJECT_ID`: Identificador del proyecto de Firebase.
- `VITE_FIREBASE_APP_ID`: Identificador de la aplicación web en Firebase.

### Configuración de AWS SES (Backend/Serverless)
- `AWS_ACCESS_KEY_ID`: ID de la clave de acceso de AWS con permisos para usar SES.
- `AWS_SECRET_ACCESS_KEY`: Clave de acceso secreta de AWS.
- `AWS_REGION`: Región en la que está configurado el servicio de AWS SES (por ejemplo, us-east-1).
- `SES_FROM_EMAIL`: Correo electrónico del remitente verificado y autorizado en tu cuenta de AWS SES para realizar los envíos.

## Instrucciones de Instalación
Sigue estos pasos detallados para clonar, configurar e iniciar el proyecto en tu máquina local:

### Requisitos Previos
- Node.js (versión 18 o superior) instalado en tu sistema. Puedes descargarlo e instalarlo desde el sitio web oficial de Node.js.
- Una cuenta de Firebase con autenticación y Firestore configurados.
- Una cuenta de AWS con el servicio SES configurado y al menos un correo verificado para realizar envíos.

### Paso 1: Descargar el Repositorio
Clona el repositorio en tu máquina local y accede al directorio del proyecto:
```bash
git clone https://github.com/SolInvictus7x7/ProyectoM4_DanielInostroza
cd ProyectoM4_DanielInostroza
```

### Paso 2: Instalar Dependencias
Instala todas las dependencias definidas en el proyecto ejecutando el comando general:
```bash
npm install react react-dom react-router-dom firebase @aws-sdk/client-ses @vercel/node vercel
```
*   `react` y `react-dom`: Núcleo de la interfaz de usuario en su versión 19.
*   `react-router-dom`: Enrutador del lado del cliente.
*   `firebase`: Conexión de servicios de Firebase Authentication y Firestore.
*   `@aws-sdk/client-ses`: Cliente de AWS SDK para enviar correos electrónicos a través de AWS SES.
*   `@vercel/node`: Tipados y utilidades para las funciones serverless de Vercel.
*   `vercel`: CLI de Vercel para desarrollo y despliegue local.

#### Dependencias de Desarrollo (Compilación, Tipados y Pruebas):
```bash
npm install -D typescript vite @vitejs/plugin-react eslint vitest @testing-library/react @testing-library/jest-dom jsdom globals @types/react @types/react-dom @types/node
```
*   `typescript`: Compilador y tipados estáticos.
*   `vite` y `@vitejs/plugin-react`: Servidor de desarrollo y empaquetador de React.
*   `vitest`, `@testing-library/react`, `@testing-library/jest-dom` y `jsdom`: Framework de pruebas unitarias y entorno DOM de simulación para pruebas en React.
*   `eslint` y `globals`: Herramientas de análisis de código estático (linter).

### Paso 3: Configurar las Variables de Entorno
Copia el archivo de ejemplo para crear tu configuración local:
```bash
cp .env.example .env
```
Abre el archivo `.env` recién creado en tu editor de código y completa los valores correspondientes con tus credenciales de Firebase y AWS.

### Paso 4: Ejecutar en Entorno Local
Para iniciar el servidor de desarrollo local y poder probar la API de envío de correos, ejecuta la herramienta de línea de comandos de Vercel:
```bash
npx vercel dev
```
Este comando levantará el servidor local (comúnmente en `http://localhost:3000`), sirviendo tanto la interfaz de React como las funciones serverless de la carpeta `/api`.

Alternativamente, si no necesitas probar las funciones serverless de envío de emails, puedes arrancar únicamente el servidor de desarrollo de Vite:
```bash
npm run dev
```

### Paso 5: Ejecutar Pruebas
Para correr el conjunto de pruebas automatizadas y asegurar que no hay errores lógicos, utiliza:
```bash
npm run test
```

## Flujo de Envío de Emails
El envío de resúmenes de tareas sigue este flujo de ejecución controlado:

1. **Interacción del Administrador**: Dentro de la vista de detalle de un grupo, el administrador del grupo selecciona un destinatario (un miembro del grupo o sí mismo) y presiona el botón "Enviar Email".
2. **Restricción de Abuso (Cooldown)**: El cliente valida si existe un bloqueo temporal en `localStorage`. Si el usuario ha enviado un correo recientemente, se le restringe el envío y se activa un contador de 5 minutos de espera.
3. **Petición HTTP**: Si el envío está permitido, el frontend de React realiza una solicitud POST a la ruta interna `/api/send-email` enviando el correo electrónico del destinatario y la cadena de texto con el listado formateado de tareas del grupo.
4. **Procesamiento Serverless**: La petición es recibida por la función serverless de Node.js alojada en Vercel, la cual extrae las claves de AWS y el email verificado del remitente desde las variables de entorno del servidor.
5. **Llamado a AWS SES**: El backend inicializa el cliente `SESClient` y envía un `SendEmailCommand` estructurado a AWS SES.
6. **Respuesta**: AWS SES procesa el envío del correo y retorna un identificador de mensaje (`MessageId`). La API responde exitosamente al frontend con un código HTTP `200 OK`, y el cliente registra el tiempo actual en `localStorage` para activar el bloqueo de 5 minutos.

## Uso de IA

La IA fue instrumental en este proyecto por la gran cantidad de archivos y rutas dentro del repositorio. Sin duda, el agente dentro del IDE es increiblemente poderoso, pero definitivamente no se le puede confiar al 100%, incluso cuando se escriben prompts casi perfectos, ya que siempre existe el riesgo de que halucine u olvide información o actualizar ciertas cosas en proyectos grandes. 
El flujo de trabajo era:

- Pensar en cómo funcionará cierta funcionalidad
- Crear prompt detallado (150-200 palabras) explicando la UX, las tecnologías a usar y dónde crear archivos o cuáles modificar
- Esperar a que ejecute los cambios
- Revisar código, hacer cambios manuales si es necesario o enviar una respuesta en la que se le pide responder más corto
- Investigar en internet en caso de bugs o errores que el agente no pudo solucionar
- Después de varios cambios, pedirle a otro agente que revise lo que hizo la otra IA

Si bien la mayor parte del código fue escrito por IA, hubieron muchas cosas que esta no hubiera podido diseñar bien, ya que innumerables veces asumía una arquitectura errónea o ineficiente. Por lo mismo, aprender a usar la IA para proyectos de esta escala sigue siendo una habilidad en si misma, ya que los errores que comete suelen ser los mismos y la forma de evitar que esto pase es algo que se aprende sobre la marcha. Sin tener que escribir miles de caracteres manualmente, uno como desarrollador se puede concentrar en la arquitectura, solución de bugs y el funcionamiento correcto de la aplicación, dejando que la IA se encargue de la escritura mecánica. Es un software que escribe software, pero en su estado actual es incapaz de razonar acerca de cómo desarrollar un proyecto completo ni tiene el contexto necesario para hacerlo sin intervención humana.