const fs = require('fs');
const path = require('path');

const logger = (req, res, next) => {
    const formattedDate = new Date().toISOString();
    const logEntry = `[${formattedDate}] - Método: ${req.method} - Ruta: ${req.url}\n`;
    
    // Apunta de forma directa a la carpeta /logs en la raíz
    const logFilePath = path.join(__dirname, '../../logs/log.txt');

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) console.error('Error en escritura de log:', err);
    });

    next();
};

module.exports = logger;