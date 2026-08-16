const getHome = (req, res) => {
    res.render('home', {
        title: 'Inicio - Web App',
        message: '¡Bienvenido a la Aplicación Web con Node.js, Express y Handlebars!'
    });
};

const getStatus = (req, res) => {
    // Si la petición acepta HTML (navegador), renderiza vista Handlebars
    if (req.accepts('html')) {
        return res.render('status', {
            title: 'Estado del Servidor',
            status: 'OK',
            uptime: process.uptime().toFixed(2),
            timestamp: new Date().toLocaleString()
        });
    }

    // Respuesta JSON por defecto para clientes API
    res.status(200).json({
        status: 'OK',
        message: 'El servidor está funcionando correctamente',
        uptime: process.uptime(),
        timestamp: new Date()
    });
};

module.exports = {
    getHome,
    getStatus
};