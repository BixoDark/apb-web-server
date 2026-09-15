# ABP M6 | Gestión de usuarios

Aplicación web desarrollada con Node.js, Express y Handlebars para administrar un directorio de usuarios desde una interfaz server-side rendered.

El proyecto permite registrar, consultar, editar y eliminar usuarios, validando los datos ingresados y dejando trazabilidad de las solicitudes y operaciones realizadas mediante un archivo de logs.

## Funcionalidades

- Página de bienvenida.
- Panel de estado del servidor con estado, tiempo activo y fecha de consulta.
- Gestión completa de usuarios:
  - Crear usuarios.
  - Listar usuarios registrados.
  - Editar información existente.
  - Eliminar usuarios.
- Validación de campos obligatorios y salario no negativo.
- Registro de accesos y operaciones en `logs/log.txt`.
- Alta transaccional: cada usuario se registra junto con su historial y se revierte todo si una acción falla.
- Manejo de rutas inexistentes con respuesta HTTP 404.
- API REST JSON para consultar y administrar usuarios desde Postman u otros clientes HTTP.
- Las respuestas públicas de usuarios incluyen todos los datos necesarios, excepto `email` y `password`.
- La interfaz web consume la API JSON y transforma sus respuestas en contenido visible.

## Tecnologías

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Express Handlebars](https://github.com/express-handlebars/express-handlebars)
- [dotenv](https://github.com/motdotla/dotenv)
- [Nodemon](https://nodemon.io/) para desarrollo

## Requisitos

- Node.js y npm instalados.
- Una terminal con acceso a la carpeta del proyecto.

Puedes comprobar las versiones disponibles con:

```bash
node --version
npm --version
```

## Instalación

1. Clona el repositorio y entra en su carpeta:

	```bash
	git clone <URL_DEL_REPOSITORIO>
	cd abp-m6
	```

2. Instala las dependencias:

	```bash
	npm install
	```

3. Crea un archivo `.env` en la raíz del proyecto si necesitas configurar un puerto distinto al predeterminado:

	```env
	PORT=3000
	```

## Ejecución

### Modo producción o ejecución estándar

```bash
npm start
```

### Modo desarrollo

Reinicia automáticamente el servidor cuando detecta cambios en los archivos:

```bash
npm run dev
```

Con la configuración predeterminada, la aplicación estará disponible en:

<http://localhost:3000>

## Rutas principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | Página de inicio |
| `GET` | `/status` | Estado del servidor en HTML o JSON |
| `GET` | `/usuarios` | Vista web; devuelve JSON con `Accept: application/json` |
| `GET` | `/api/usuarios` | Devuelve todos los usuarios en JSON |
| `POST` | `/api/usuarios` | Crea un usuario desde un cuerpo JSON |
| `PUT` | `/api/usuarios/:id` | Actualiza un usuario desde un cuerpo JSON |
| `DELETE` | `/api/usuarios/:id` | Elimina un usuario |
| `PUT` | `/usuarios/:id` | Actualiza un usuario desde un cuerpo JSON |
| `DELETE` | `/usuarios/:id` | Elimina un usuario |

Las rutas `/usuarios` conservan el flujo de formularios web tradicional. La API utiliza los métodos HTTP estándar: `GET` para consultar (pull), `POST` para crear, `PUT` para actualizar y `DELETE` para eliminar. `push` y `pull` no son métodos HTTP; son términos habituales para enviar y obtener información.

## Uso con Postman

Para `POST` y `PUT`, selecciona **Body > raw > JSON** y utiliza:

```json
{
	"nombre": "Ana",
	"apellido": "Pérez",
	"lugar": "Santiago",
	"salario": "850000"
}
```

También debes enviar el encabezado:

```text
Content-Type: application/json
```

Ejemplos de URLs:

```text
GET    http://localhost:3000/api/usuarios
POST   http://localhost:3000/api/usuarios
PUT    http://localhost:3000/api/usuarios/1
DELETE http://localhost:3000/api/usuarios/1
```

Las respuestas de la API tienen formato JSON. Las operaciones exitosas incluyen un mensaje y, cuando corresponde, el usuario afectado. Por seguridad, las respuestas públicas de usuarios no incluyen los campos `email` ni `password`; esos datos permanecen disponibles internamente para autenticación y validaciones.

### Datos de usuario

El formulario utiliza los siguientes campos:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `nombre` | Texto | Obligatorio |
| `apellido` | Texto | Obligatorio |
| `lugar` | Texto | Obligatorio |
| `salario` | Número | Obligatorio y mayor o igual que `0` |

Los campos `email` y `password` se utilizan en el registro, inicio de sesión y actualización del perfil, pero no se devuelven en las respuestas públicas de la API de usuarios.

Para obtener la respuesta JSON del estado del servidor, realiza una solicitud que no acepte HTML. Por ejemplo:

```bash
curl -H "Accept: application/json" http://localhost:3000/status
```

## Estructura del proyecto

```text
abp-m6/
├── public/                 # Archivos estáticos: CSS y JavaScript del cliente
├── src/
│   ├── controllers/        # Lógica de las solicitudes
│   ├── middlewares/        # Middleware de logging
│   ├── routes/             # Definición de rutas
│   ├── views/              # Plantillas Handlebars y layout principal
├── logs/
│   └── log.txt             # Registro de accesos y operaciones
├── server.js               # Punto de entrada del servidor
├── package.json            # Scripts y dependencias
└── .env                    # Variables de entorno locales, no versionar
```

## Persistencia y logs

Los usuarios se almacenan en PostgreSQL mediante Sequelize, en la tabla `usuarios`. La estructura se sincroniza al iniciar el servidor. La carpeta `logs/` conserva un registro de accesos, altas, modificaciones y eliminaciones en formato de texto. Las ediciones registran el actor, el ID del usuario afectado, los campos modificados y sus nuevos valores. Si la solicitud no tiene una sesión autenticada, el actor se registra como `Usuario genérico`.

Ejemplo de una edición registrada:

```text
[2026-09-14T12:00:00.000Z] - USUARIO EDITADO - Actor: Juan Pérez - ID: 4 - Modificaciones: lugar: "Santiago", salario: "850000"
```

Cuando se cambia una contraseña desde el perfil, el log registra únicamente `password: "[MODIFICADA]"`; nunca se guarda la contraseña ni su hash en el archivo de log.

La tabla `historial_usuarios` registra la acción `CREADO` asociada a cada alta. El alta del usuario y su historial se ejecuta dentro de una única transacción Sequelize. Si ocurre un error, ambas operaciones hacen rollback y se registra el resultado en consola y en `logs/log.txt`.

### Evidencia del rollback

Para forzar un fallo controlado, envía `forzarFallo: true` junto con los datos de un usuario:

```powershell
$body = @{ nombre = 'Rollback'; apellido = 'Prueba'; lugar = 'Santiago'; salario = '1000'; forzarFallo = $true } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/usuarios' -Method Post -ContentType 'application/json' -Body $body
```

La respuesta será `500` con `rollback: true`, no aparecerá ningún usuario nuevo en `GET /api/usuarios` y la consola mostrará `TRANSACCION ROLLBACK`.

El archivo `.env` debe mantenerse fuera del control de versiones. Si se utiliza Git, se recomienda incluirlo en `.gitignore` junto con otros archivos locales o sensibles.

## Scripts disponibles

| Comando | Uso |
| --- | --- |
| `npm start` | Inicia el servidor con Node.js |
| `npm run dev` | Inicia el servidor con Nodemon |
| `npm test` | Placeholder de pruebas; todavía no hay una suite configurada |

## Autor

**Victor Navarrete**

## Licencia

Este proyecto se distribuye bajo la licencia ISC, de acuerdo con la configuración de `package.json`.
