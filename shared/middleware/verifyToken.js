const admin = require('../firebase/firebaseAdmin');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            emailVerified: decodedToken.email_verified,
            phoneNumber: decodedToken.phone_number,
            firebase: decodedToken
        };
        
        next();
    } catch (error) {
        console.error('Error verifying token:', error.message);
        
        // Specific error messages based on error type
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Unauthorized: Token expired' });
        }
        
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
        }
        
        if (error.code === 'auth/user-not-found') {
            return res.status(403).json({ error: 'Unauthorized: User not found' });
        }
        
        // Generic error for other cases
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = verifyToken;