const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// Ruta principal públicas
router.get('/', mainController.getHome);

// Ruta de estado del servidor
router.get('/status', mainController.getStatus);
router.get('/api/usuarios', mainController.getUsersJson);
router.post('/api/usuarios', mainController.createUserJson);
router.put('/api/usuarios/:id', mainController.updateUserJson);
router.delete('/api/usuarios/:id', mainController.deleteUserJson);
router.get('/usuarios', mainController.getUsers);
router.post('/usuarios', mainController.createUser);
router.post('/usuarios/:id/editar', mainController.updateUser);
router.post('/usuarios/:id/eliminar', mainController.deleteUser);

module.exports = router;