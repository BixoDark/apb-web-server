// 1. Cargar variables de entorno (.env)
require('dotenv').config();

// 2. Importar dependencias necesarias
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

// NUEVO: Importar la conexión a la base de datos
const { sequelize, testConnection } = require('./src/config/database');

// IMPORTANDO MODELO USER
const User = require('./src/models/user');

// 3. Importar middlewares y rutas personalizadas
const loggerMiddleware = require('./src/middlewares/loggers');
const sessionMiddleware = require('./src/middlewares/session');
const routes = require('./src/routes');

// 4. Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// 5. Configurar el motor de plantillas (Express-Handlebars)
app.engine('handlebars', engine({
    extname: '.handlebars',
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src', 'views'));

// 6. Configurar Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// Servir archivos estáticos desde /public (CSS, JS cliente, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware personalizado para registrar accesos en logs/log.txt
app.use(loggerMiddleware);

// 7. Montar las Rutas del proyecto
app.use('/', routes);

// 8. Manejo de ruta no encontrada (Error 404)
app.use((req, res) => {
    res.status(404).render('home', {
        title: '404 - No Encontrado',
        message: 'La página que estás buscando no existe.'
    });
});

// 9. Iniciar el servidor tras verificar la base de datos
const startServer = async () => {
    try {
        await testConnection();
        await sequelize.sync({ alter: true });
        console.log(' Tablas sincronizadas correctamente.');

        app.listen(PORT, () => {
            console.log(` Servidor iniciado con éxito.`);
            console.log(` Escuchando en: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(' Error crítico al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

startServer();