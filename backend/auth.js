const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-for-driver-sentiment-mvp';

// Middleware to protect routes
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
}

// Generate token
function generateToken(userPayload) {
    return jwt.sign(userPayload, SECRET_KEY, { expiresIn: '2h' });
}

// Role-based access control middleware
function authorizeRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access forbidden: Insufficient role.' });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    generateToken,
    authorizeRole,
    SECRET_KEY
};
