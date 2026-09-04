const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../logs/log.txt');

const writeLog = (message) => {
    const formattedDate = new Date().toISOString();
    const logEntry = `[${formattedDate}] - ${message}\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) console.error('Error en escritura de log:', err);
    });
};

const logger = (req, res, next) => {
    writeLog(`Método: ${req.method} - Ruta: ${req.url}`);
    next();
};

module.exports = logger;
module.exports.writeLog = writeLog;