const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// Ruta principal públicas
router.get('/', mainController.getHome);

// Ruta de estado del servidor
router.get('/status', mainController.getStatus);

module.exports = router;