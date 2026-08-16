// 1. Cargar variables de entorno (.env)
require('dotenv').config();

// 2. Importar dependencias necesarias
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

// 3. Importar middlewares y rutas personalizadas
const loggerMiddleware = require('./src/middlewares/loggers');
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

// 9. Iniciar el servidor
app.listen(PORT, () => {
    console.log(` Servidor iniciado con éxito.`);
    console.log(` Escuchando en: http://localhost:${PORT}`);
});