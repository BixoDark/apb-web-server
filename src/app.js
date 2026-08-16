const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

const loggerMiddleware = require('./middlewares/logger');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Motor de plantillas (Vistas dentro de src)
app.engine('handlebars', engine({ extname: '.handlebars', defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(loggerMiddleware);

// Rutas
app.use('/', routes);

// 404
app.use((req, res) => {
    res.status(404).render('home', {
        title: '404 - No Encontrado',
        message: 'La página solicitada no existe.'
    });
});

app.listen(PORT, () => {
    console.log(`Servidor activo en: http://localhost:${PORT}`);
});