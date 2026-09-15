const bcrypt = require('bcrypt');
const { writeLog } = require('../middlewares/loggers');
const { sequelize } = require('../config/database');
const User = require('../models/user');
const UserHistory = require('../models/userHistory');

const publicUserAttributes = { exclude: ['email', 'password'] };
const toPublicUser = (user) => {
    const values = user.toJSON();
    delete values.email;
    delete values.password;
    return values;
};
const getActorName = (req) => {
    const actor = req.sessionUser;
    if (!actor) return 'Usuario genérico';
    const name = [actor.nombre, actor.apellido].filter(Boolean).join(' ').trim();
    return name || actor.email || 'Usuario genérico';
};
const getChanges = (previousValues, updatedValues) => Object.entries(updatedValues)
    .filter(([field, value]) => String(previousValues[field] ?? '') !== String(value ?? ''))
    .map(([field, value]) => `${field}: ${JSON.stringify(value)}`)
    .join(', ') || 'sin cambios';

const getUserData = (body) => ({
    nombre: String(body.nombre || '').trim(),
    apellido: String(body.apellido || '').trim(),
    lugar: String(body.lugar || '').trim(),
    salario: String(body.salario || '').trim()
});

const validateUser = (user) => user.nombre && user.apellido && user.lugar && user.salario && Number(user.salario) >= 0;

const shouldForceTransactionFailure = (req) => req.query.forzarFallo === 'true'
    || String(req.body.forzarFallo).toLowerCase() === 'true';

const createUserWithHistory = async (userData, forceFailure = false) => sequelize.transaction(async (transaction) => {
    const createdUser = await User.create(userData, { transaction });

    if (forceFailure) {
        throw new Error('Fallo forzado para comprobar el rollback de la transacción.');
    }

    await UserHistory.create({
        usuarioId: createdUser.id,
        accion: 'CREADO',
        detalle: { ...userData, password: '[HASHED]' }
    }, { transaction });

    return createdUser;
});

const logTransactionError = (error) => {
    console.error(`[TRANSACCION] ROLLBACK: ${error.message}`);
    writeLog(`TRANSACCION ROLLBACK - ${error.message}`);
};

// Renderizar formulario de login / registro
const getLogin = (req, res) => {
    const isRegister = req.query.modo === 'registro';
    res.render('login', {
        title: isRegister ? 'Registro de Usuario' : 'Iniciar Sesión',
        isRegister
    });
};

// Procesamiento unificado de Login y Registro
const login = async (req, res) => {
    const isRegister = req.path === '/registro' || req.query.modo === 'registro';
    const nombre = String(req.body.nombre || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const ciudad = String(req.body.ciudad || '').trim();
    const password = String(req.body.password || '');

    try {
        // CASO 1: REGISTRO DE USUARIO
        if (isRegister) {
            if (!nombre || !email || !ciudad || password.length < 8) {
                return res.status(400).render('login', {
                    title: 'Registro de Usuario',
                    isRegister: true,
                    error: 'Completa todos los campos y utiliza una contraseña de al menos 8 caracteres.'
                });
            }

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).render('login', {
                    title: 'Registro de Usuario',
                    isRegister: true,
                    error: 'El correo electrónico ya se encuentra registrado.'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Separar nombre y apellido si viene compuesto desde el input único
            const partesNombre = nombre.trim().split(' ');
            const primerNombre = partesNombre[0] || '';
            const primerApellido = partesNombre.slice(1).join(' ') || '-';

            const newUserData = {
                nombre: primerNombre,
                apellido: primerApellido,
                email,
                lugar: ciudad,
                password: hashedPassword,
                salario: 0 // Valor base por defecto para el registro público
            };

            const createdUser = await createUserWithHistory(newUserData, shouldForceTransactionFailure(req));
            writeLog(`TRANSACCION COMMIT - USUARIO REGISTRADO - ID: ${createdUser.id} - Email: ${createdUser.email}`);

            return res.status(201).render('login', {
                title: 'Iniciar Sesión',
                isRegister: false,
                success: 'Usuario registrado correctamente. Ahora puedes iniciar sesión.'
            });
        }

        // CASO 2: INICIO DE SESIÓN
        if (!email || !password) {
            return res.status(400).render('login', {
                title: 'Iniciar Sesión',
                isRegister: false,
                error: 'Debes ingresar correo y contraseña.'
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user || !user.password) {
            return res.status(401).render('login', {
                title: 'Iniciar Sesión',
                isRegister: false,
                error: 'Credenciales inválidas.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).render('login', {
                title: 'Iniciar Sesión',
                isRegister: false,
                error: 'Credenciales inválidas.'
            });
        }

        // Guardar usuario en sesión si usas express-session
        if (req.startSession) {
            req.startSession({
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email
            });
        }

        writeLog(`LOGIN EXITOSO - ID: ${user.id} - Email: ${user.email}`);
        return res.redirect('/perfil');

    } catch (error) {
        logTransactionError(error);
        return res.status(500).render('login', {
            title: isRegister ? 'Registro de Usuario' : 'Iniciar Sesión',
            isRegister,
            error: 'Ocurrió un error en el servidor al procesar la solicitud.'
        });
    }
};

const getHome = (req, res) => {
    res.render('home', {
        title: 'Inicio - Web App',
        message: '¡Bienvenido a la Aplicación Web con Node.js, Express y Handlebars!'
    });
};

const getStatus = (req, res) => {
    if (req.accepts('html')) {
        return res.render('status', {
            title: 'Estado del Servidor',
            status: 'OK',
            uptime: process.uptime().toFixed(2),
            timestamp: new Date().toLocaleString()
        });
    }

    res.status(200).json({
        status: 'OK',
        message: 'El servidor está funcionando correctamente',
        uptime: process.uptime(),
        timestamp: new Date()
    });
};

const getUsers = async (req, res) => {
    const users = await User.findAll({
        attributes: publicUserAttributes,
        order: [['id', 'ASC']]
    });
    const requestedUser = req.query.editar ? await User.findByPk(req.query.editar) : null;
    if (req.get('Accept')?.includes('application/json')) {
        return res.status(200).json({
            total: users.length,
            usuarios: users
        });
    }

    res.render('users', {
        title: 'Usuarios',
        users: users.map((user) => user.toJSON()),
        editingUser: requestedUser?.password ? null : requestedUser?.toJSON(),
        editingBlocked: Boolean(requestedUser?.password),
        error: req.query.error === 'transaccion'
            ? 'No se pudo guardar el usuario. La transacción fue revertida.'
            : req.query.error === 'auth'
            ? 'No se puede modificar al Usuario.'
            : req.query.error ? 'Completa todos los campos y utiliza un salario válido.' : null
    });
};

const createUser = async (req, res) => {
    const user = getUserData(req.body);
    if (!validateUser(user)) return res.redirect('/usuarios?error=1');
    try {
        const createdUser = await createUserWithHistory(user, shouldForceTransactionFailure(req));
        writeLog(`TRANSACCION COMMIT - USUARIO AGREGADO - ID: ${createdUser.id}`);
        res.redirect('/usuarios');
    } catch (error) {
        logTransactionError(error);
        res.redirect('/usuarios?error=transaccion');
    }
};

const updateUser = async (req, res) => {
    const updatedUser = getUserData(req.body);
    const user = await User.findByPk(req.params.id);
    if (user?.password) return res.redirect('/usuarios?error=auth');
    if (!user || !validateUser(updatedUser)) return res.redirect('/usuarios?error=1');
    const previousValues = user.toJSON();
    await user.update(updatedUser);
    writeLog(`USUARIO EDITADO - Actor: ${getActorName(req)} - ID: ${user.id} - Modificaciones: ${getChanges(previousValues, updatedUser)}`);
    res.redirect('/usuarios');
};

const deleteUser = async (req, res) => {
    const deletedUser = await User.findByPk(req.params.id);
    if (!deletedUser) return res.redirect('/usuarios');
    if (deletedUser.password) return res.redirect('/usuarios?error=auth');
    await deletedUser.destroy();
    writeLog(`USUARIO ELIMINADO - ID: ${deletedUser.id} - Nombre: ${deletedUser.nombre} ${deletedUser.apellido} - Lugar: ${deletedUser.lugar} - Salario: ${deletedUser.salario}`);
    res.redirect('/usuarios');
};

const sendValidationError = (res) => res.status(400).json({
    error: 'Completa todos los campos y utiliza un salario válido.'
});

const getUsersJson = async (req, res) => {
    const users = await User.findAll({
        attributes: publicUserAttributes,
        order: [['id', 'ASC']]
    });
    res.status(200).json({
        total: users.length,
        usuarios: users
    });
};

const createUserJson = async (req, res) => {
    const user = getUserData(req.body);
    if (!validateUser(user)) return sendValidationError(res);
    try {
        const createdUser = await createUserWithHistory(user, shouldForceTransactionFailure(req));
        writeLog(`TRANSACCION COMMIT - USUARIO AGREGADO - ID: ${createdUser.id}`);
        res.status(201).json({ mensaje: 'Usuario creado correctamente.', usuario: toPublicUser(createdUser) });
    } catch (error) {
        logTransactionError(error);
        res.status(500).json({
            error: 'No fue posible crear el usuario. La transacción fue revertida.',
            rollback: true
        });
    }
};

const updateUserJson = async (req, res) => {
    const updatedUser = getUserData(req.body);
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (user.password) return res.status(403).json({ error: 'No se puede modificar al Usuario.' });
    if (!validateUser(updatedUser)) return sendValidationError(res);
    const previousValues = user.toJSON();
    await user.update(updatedUser);
    writeLog(`USUARIO EDITADO - Actor: ${getActorName(req)} - ID: ${user.id} - Modificaciones: ${getChanges(previousValues, updatedUser)}`);
    res.status(200).json({ mensaje: 'Usuario actualizado correctamente.', usuario: toPublicUser(user) });
};

const deleteUserJson = async (req, res) => {
    const deletedUser = await User.findByPk(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (deletedUser.password) return res.status(403).json({ error: 'No se puede eliminar el Usuario.' });
    await deletedUser.destroy();
    writeLog(`USUARIO ELIMINADO - ID: ${deletedUser.id} - Nombre: ${deletedUser.nombre} ${deletedUser.apellido} - Lugar: ${deletedUser.lugar} - Salario: ${deletedUser.salario}`);
    res.status(200).json({ mensaje: 'Usuario eliminado correctamente.', usuario: toPublicUser(deletedUser) });
};
// Mostrar el perfil del usuario autenticado
const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.sessionUser.id);
        if (!user) {
            req.endSession();
            return res.redirect('/login');
        }

        res.render('profile', {
            title: 'Mi Perfil',
            user: user.toJSON(),
            success: req.query.success === '1' ? 'Datos actualizados con éxito.' : null,
            error: req.query.error ? 'Hubo un error al actualizar los datos.' : null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/usuarios');
    }
};

// Actualizar datos propios
const updateProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.sessionUser.id);
        if (!user) return res.redirect('/login');

        const { nombre, apellido, lugar, email, password, salario } = req.body;
        const parsedSalary = Number(salario);

        // Validación básica
        if (!nombre || !apellido || !lugar || !Number.isFinite(parsedSalary) || parsedSalary < 0) {
            return res.redirect('/perfil?error=1');
        }

        const previousValues = user.toJSON();
        const updatedValues = {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            lugar: lugar.trim(),
            email: email ? email.trim() : user.email,
            salario: parsedSalary
        };

        user.nombre = updatedValues.nombre;
        user.apellido = updatedValues.apellido;
        user.lugar = updatedValues.lugar;
        user.email = updatedValues.email;
        user.salario = updatedValues.salario;

        // Si el usuario ingresó una nueva contraseña, se hashea
        if (password && password.trim() !== '') {
            user.password = await bcrypt.hash(password.trim(), 10);
        }

        await user.save();

        const profileChanges = getChanges(previousValues, {
            ...updatedValues,
            password: password && password.trim() !== '' ? '[MODIFICADA]' : previousValues.password
        });
        writeLog(`PERFIL ACTUALIZADO - Actor: ${getActorName(req)} - ID: ${user.id} - Modificaciones: ${profileChanges}`);
        return res.redirect('/perfil?success=1');
    } catch (error) {
        console.error(error);
        return res.redirect('/perfil?error=1');
    }
};

module.exports = {
    getHome,
    getStatus,
    getLogin,
    login,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getUsersJson,
    createUserJson,
    updateUserJson,
    deleteUserJson,
    getProfile,
    updateProfile
};