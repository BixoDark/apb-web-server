# Commercial Inventory & Event Supply Planner

Sistema backend modular desarrollado con **Node.js** y **Express** diseñado para optimizar el control de existencias, previsión de demanda y aprovisionamiento estratégico de inventario vinculado a eventos comerciales para pequeños y medianos comercios.

---

## 🎯 Visión General

**Commercial Inventory Planner** proporciona una base de servicios web y renderizado dinámico para la administración de stock en función de fechas críticas (temporadas altas, eventos especiales, ferias comerciales). 

Esta primera fase arquitectónica establece el núcleo del servidor, control de acceso a recursos estáticos, procesamiento de vistas mediante motor de plantillas, exposición de endpoints de diagnóstico y un subsistema de persistencia en archivos planos para auditoría de tráfico.

---

## ⚙️ Requisitos Previos

* **Node.js**: v18.0.0 o superior
* **NPM**: v9.0.0 o superior
* **Entorno**: Compatible con sistemas UNIX (Linux/macOS) y Windows

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/BixoDark/Commercial-Inventory-Planner.git
cd Commercial-Inventory-Planner
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente plantilla:
```env
PORT=3000
NODE_ENV=development
```

### 4. Ejecución del aplicativo

El archivo `package.json` cuenta con scripts parametrizados según el entorno de trabajo:

```bash
# Modo Desarrollo (monitoreo en tiempo real y reinicio automático con nodemon)
npm run dev

# Modo Producción (ejecución estándar de servidor)
npm start
```

---

## 🏗️ Arquitectura y Estructura del Proyecto

La estructura del código sigue una separación estricta de responsabilidades bajo el patrón MVC:

```text
Commercial-Inventory-Planner/
│
├── logs/
│   └── log.txt                  # Bitácora de persistencia y trazabilidad de tráfico
│
├── public/                      # Activos públicos y estáticos servidos por Express
│   ├── css/                     # Hojas de estilo UI / Dashboard
│   ├── js/                      # Lógica interactiva del lado del cliente
│   └── images/                  # Recursos gráficos
│
├── src/
│   ├── controllers/             # Controladores que resuelven la lógica de negocio
│   ├── middlewares/             # Funciones intermedias (logger de auditoría, parseo)
│   │   └── loggers.js           # Middleware de registro de peticiones (módulo fs)
│   ├── routes/                  # Enrutadores modulares de la aplicación
│   │   └── index.js             # Definición de rutas públicas y puntos de acceso
│   └── views/                   # Vistas y layouts de la interfaz
│       ├── layouts/
│       │   └── main.handlebars  # Layout contenedor global
│       └── home.handlebars      # Vista de inventario y programación de eventos
│
├── .env.example                 # Plantilla de referencia de entorno
├── .gitignore                   # Reglas de exclusión de dependencias y secretos
├── package.json                 # Configuración de dependencias y scripts de inicio
├── README.md                    # Documentación del sistema
└── server.js                    # Punto de entrada y configuración central del servidor
```

---

## 🔌 Especificación de Rutas y Servicios

| Método | Ruta | Formato | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `text/html` | Renderiza la interfaz principal del sistema con panel de inventario y eventos próximos. |
| `GET` | `/status` | `application/json` | Endpoint de diagnóstico que expone el estado de salud del servidor, timestamp y versión. |
| `*` | Ruta indefinida | `text/html` | Captura de rutas no contempladas (Manejo centralizado de Error 404). |

---

## 📐 Decisiones de Diseño y Fundamentos Técnicos

### Punto de Entrada (`server.js`)
Se definió `server.js` como el archivo principal de la aplicación para designar de forma semántica el archivo responsable de montar la infraestructura HTTP, inicializar los middlewares del ciclo de vida de Express, definir el motor de plantillas y habilitar la escucha del puerto de red.

### Modularización en Capas
El proyecto desacopla las capas de transporte (`routes`), procesamiento (`controllers`) y validación/auditoría (`middlewares`). Esta separación garantiza alta mantenibilidad, facilita las pruebas unitarias y simplifica la posterior integración de capas de acceso a datos (ORM/ODM) y autenticación basada en tokens.

### Persistencia y Auditoría de Tráfico (`fs.appendFile`)
Se implementó un middleware de auditoría en `src/middlewares/loggers.js` que utiliza el sistema de archivos nativo de Node.js (`fs.appendFile`) para registrar de forma no bloqueante cada interacción con el servidor en `logs/log.txt`. Cada registro almacena:
* Timestamp detallado (fecha y hora exacta).
* Método HTTP (`GET`, `POST`, etc.).
* Ruta solicitada y dirección IP cliente.

Esto provee una bitácora local de trazabilidad de uso del sistema sin penalizar el rendimiento del bucle de eventos (*event loop*).

### Motor de Vistas y Distribución Estática
Se utilizó `express-handlebars` para componer plantillas HTML modulares mediante layouts compartidos, integrando `express.static()` para distribuir eficientemente recursos de soporte en `/public` (CSS, JS cliente y multimedia).

---

## 👨‍💻 Autor

* **Victor Navarrete**