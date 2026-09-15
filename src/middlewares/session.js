const crypto = require('crypto');

const sessions = new Map();
const COOKIE_NAME = 'abp_session';
const SESSION_TTL = 1000 * 60 * 30;

const parseCookies = (header = '') => Object.fromEntries(header.split(';').map((part) => {
    const [name, ...value] = part.trim().split('=');
    return [name, decodeURIComponent(value.join('='))];
}).filter(([name]) => name));

const setSessionCookie = (res, sessionId, maxAge = SESSION_TTL) => {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(sessionId)}; Max-Age=${Math.floor(maxAge / 1000)}; HttpOnly; SameSite=Lax; Path=/`);
};

const sessionMiddleware = (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies[COOKIE_NAME];
    const session = sessionId && sessions.get(sessionId);

    if (session && session.expiresAt > Date.now()) {
        req.sessionUser = session.user;
        session.expiresAt = Date.now() + SESSION_TTL;
    } else if (sessionId) {
        sessions.delete(sessionId);
        setSessionCookie(res, '', 0);
    }

    res.locals.sessionUser = req.sessionUser || null;

    req.startSession = (user) => {
        const newSessionId = crypto.randomBytes(32).toString('hex');
        sessions.set(newSessionId, { user, expiresAt: Date.now() + SESSION_TTL });
        setSessionCookie(res, newSessionId);
    };

    req.endSession = () => {
        if (sessionId) sessions.delete(sessionId);
        setSessionCookie(res, '', 0);
        req.sessionUser = null;
    };

    next();
};

const requireAuth = (req, res, next) => {
    if (!req.sessionUser) return res.redirect('/login');
    next();
};

module.exports = sessionMiddleware;
module.exports.requireAuth = requireAuth;
