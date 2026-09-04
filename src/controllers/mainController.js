const { writeLog } = require('../middlewares/loggers');
const users = [];
let nextUserId = 1;

const getUserData = (body) => ({
    nombre: String(body.nombre || '').trim(),
    apellido: String(body.apellido || '').trim(),
    lugar: String(body.lugar || '').trim(),
    salario: String(body.salario || '').trim()
});

const validateUser = (user) => user.nombre && user.apellido && user.lugar && user.salario && Number(user.salario) >= 0;

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

const getUsers = (req, res) => {
    if (req.get('Accept')?.includes('application/json')) {
        return res.status(200).json({
            total: users.length,
            usuarios: users
        });
    }

    res.render('users', {
        title: 'Usuarios',
        users,
        editingUser: req.query.editar ? users.find((user) => user.id === Number(req.query.editar)) : null,
        error: req.query.error ? 'Completa todos los campos y utiliza un salario válido.' : null
    });
};

const createUser = (req, res) => {
    const user = getUserData(req.body);
    if (!validateUser(user)) return res.redirect('/usuarios?error=1');
    user.id = nextUserId++;
    users.push(user);
    writeLog(`USUARIO AGREGADO - ID: ${user.id} - Nombre: ${user.nombre} ${user.apellido} - Lugar: ${user.lugar} - Salario: ${user.salario}`);
    res.redirect('/usuarios');
};

const updateUser = (req, res) => {
    const userIndex = users.findIndex((user) => user.id === Number(req.params.id));
    const updatedUser = getUserData(req.body);
    if (userIndex === -1 || !validateUser(updatedUser)) return res.redirect('/usuarios?error=1');
    updatedUser.id = users[userIndex].id;
    users[userIndex] = updatedUser;
    writeLog(`USUARIO EDITADO - ID: ${updatedUser.id} - Nombre: ${updatedUser.nombre} ${updatedUser.apellido} - Lugar: ${updatedUser.lugar} - Salario: ${updatedUser.salario}`);
    res.redirect('/usuarios');
};

const deleteUser = (req, res) => {
    const userIndex = users.findIndex((user) => user.id === Number(req.params.id));
    if (userIndex === -1) return res.redirect('/usuarios');
    const [deletedUser] = users.splice(userIndex, 1);
    writeLog(`USUARIO ELIMINADO - ID: ${deletedUser.id} - Nombre: ${deletedUser.nombre} ${deletedUser.apellido} - Lugar: ${deletedUser.lugar} - Salario: ${deletedUser.salario}`);
    res.redirect('/usuarios');
};

const sendValidationError = (res) => res.status(400).json({
    error: 'Completa todos los campos y utiliza un salario válido.'
});

const getUsersJson = (req, res) => {
    res.status(200).json({
        total: users.length,
        usuarios: users
    });
};

const createUserJson = (req, res) => {
    const user = getUserData(req.body);
    if (!validateUser(user)) return sendValidationError(res);
    user.id = nextUserId++;
    users.push(user);
    writeLog(`USUARIO AGREGADO - ID: ${user.id} - Nombre: ${user.nombre} ${user.apellido} - Lugar: ${user.lugar} - Salario: ${user.salario}`);
    res.status(201).json({ mensaje: 'Usuario creado correctamente.', usuario: user });
};

const updateUserJson = (req, res) => {
    const userIndex = users.findIndex((user) => user.id === Number(req.params.id));
    const updatedUser = getUserData(req.body);
    if (userIndex === -1) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (!validateUser(updatedUser)) return sendValidationError(res);
    updatedUser.id = users[userIndex].id;
    users[userIndex] = updatedUser;
    writeLog(`USUARIO EDITADO - ID: ${updatedUser.id} - Nombre: ${updatedUser.nombre} ${updatedUser.apellido} - Lugar: ${updatedUser.lugar} - Salario: ${updatedUser.salario}`);
    res.status(200).json({ mensaje: 'Usuario actualizado correctamente.', usuario: updatedUser });
};

const deleteUserJson = (req, res) => {
    const userIndex = users.findIndex((user) => user.id === Number(req.params.id));
    if (userIndex === -1) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const [deletedUser] = users.splice(userIndex, 1);
    writeLog(`USUARIO ELIMINADO - ID: ${deletedUser.id} - Nombre: ${deletedUser.nombre} ${deletedUser.apellido} - Lugar: ${deletedUser.lugar} - Salario: ${deletedUser.salario}`);
    res.status(200).json({ mensaje: 'Usuario eliminado correctamente.', usuario: deletedUser });
};

module.exports = {
    getHome,
    getStatus,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getUsersJson,
    createUserJson,
    updateUserJson,
    deleteUserJson
};