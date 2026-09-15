const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const { requireAuth } = require('../middlewares/session');

// Ruta principal públicas
router.get('/', mainController.getHome);

// Ruta de estado del servidor
router.get('/status', mainController.getStatus);
router.get('/api/usuarios', mainController.getUsersJson);
router.post('/api/usuarios', mainController.createUserJson);
router.put('/api/usuarios/:id', mainController.updateUserJson);
router.delete('/api/usuarios/:id', mainController.deleteUserJson);
router.put('/usuarios/:id', mainController.updateUserJson);
router.delete('/usuarios/:id', mainController.deleteUserJson);
router.get('/usuarios', mainController.getUsers);
router.post('/usuarios', mainController.createUser);
router.post('/usuarios/:id/editar', mainController.updateUser);
router.post('/usuarios/:id/eliminar', mainController.deleteUser);
router.get('/login', mainController.getLogin);
router.post('/login', mainController.login);
router.post('/registro', mainController.login);
router.get('/perfil', requireAuth, mainController.getProfile);
router.post('/perfil', requireAuth, mainController.updateProfile);
router.get('/logout', (req, res) => {
	req.endSession();
	res.redirect('/login');
});

module.exports = router;