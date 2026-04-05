const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load .env manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && !key.startsWith('#')) {
            const value = valueParts.join('=');
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;

// Get API key directly from process.env
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

console.log(' Environment Check:');
console.log('   PORT:', PORT);
console.log('   API Key exists:', !!FIREBASE_API_KEY);
console.log('   API Key length:', FIREBASE_API_KEY ? FIREBASE_API_KEY.length : 0);
console.log('   Project ID:', process.env.VITE_FIREBASE_PROJECT_ID);

if (!FIREBASE_API_KEY) {
    console.error(' CRITICAL: FIREBASE_API_KEY is missing!');
    process.exit(1);
}

// Fix the paths - from auth-service/src to shared folder (3 levels up)
const admin = require('../../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../../shared/middleware/verifyToken');

app.get('/health', (req, res) => {
    res.json({ service: 'auth-service', status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * POST /register
 * Register a new user
 */
app.post('/register', async (req, res) => {
    try {
        const { email, password, displayName, role = 'Member' } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (!['Member', 'Treasurer', 'Admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: displayName || email.split('@')[0],
        });

        await admin.auth().setCustomUserClaims(userRecord.uid, { role });

        const db = admin.firestore();
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || '',
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            groupIds: [],
            isActive: true
        });

        // Get auth token using Firebase REST API
        const apiKey = process.env.VITE_FIREBASE_API_KEY;
        const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true
            })
        });

        const signInData = await signInResponse.json();

        if (!signInResponse.ok) {
            console.error('Failed to get token after registration:', signInData.error?.message);
            // Still return user data even if token generation fails
            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName,
                    role
                }
            });
        }

        res.status(201).json({
            message: 'User registered successfully',
            idToken: signInData.idToken,
            refreshToken: signInData.refreshToken,
            expiresIn: signInData.expiresIn,
            localId: signInData.localId,
            email: signInData.email,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                role
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: error.message || 'Failed to register user' });
    }
});

/**
 * POST /login
 * Get Firebase token using REST API
 */
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        console.log(' Login attempt for:', email);
        
        // Use the API key from process.env
        const apiKey = process.env.VITE_FIREBASE_API_KEY;
        
        console.log('   API Key from process.env:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT FOUND');
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Firebase API key not configured. Check .env file.' });
        }

        // Call Firebase REST API
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log('   Login failed:', data.error?.message);
            return res.status(401).json({ error: data.error?.message || 'Invalid credentials' });
        }

        // Get user role
        const userRecord = await admin.auth().getUser(data.localId);
        const role = userRecord.customClaims?.role || 'Member';

        console.log('   Login successful for:', email, 'Role:', role);

        res.json({
            message: 'Login successful',
            idToken: data.idToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
            localId: data.localId,
            email: data.email,
            role: role
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: error.message || 'Login failed' });
    }
});

/**
 * POST /verify-token
 */
app.post('/verify-token', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        res.json({
            message: 'Token verified',
            user: {
                uid: req.user.uid,
                email: req.user.email,
                role: req.user.role,
                ...userDoc.data()
            }
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ error: error.message || 'Token verification failed' });
    }
});

/**
 * GET /user/:uid
 */
app.get('/user/:uid', verifyToken, async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (req.user.uid !== uid && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized to view this user' });
        }
        
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: userDoc.data() });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch user' });
    }
});

/**
 * PUT /user/:uid
 */
app.put('/user/:uid', verifyToken, async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (req.user.uid !== uid && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized to update this user' });
        }
        
        const updateData = req.body;
        if (updateData.role) delete updateData.role;

        const db = admin.firestore();
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await db.collection('users').doc(uid).update(updateData);

        res.json({ message: 'User profile updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message || 'Failed to update user' });
    }
});

/**
 * POST /change-role
 */
app.post('/change-role', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admins can change user roles' });
        }

        const { userId, newRole } = req.body;

        if (!userId || !newRole) {
            return res.status(400).json({ error: 'userId and newRole are required' });
        }

        if (!['Member', 'Treasurer', 'Admin'].includes(newRole)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        await admin.auth().setCustomUserClaims(userId, { role: newRole });

        const db = admin.firestore();
        await db.collection('users').doc(userId).update({
            role: newRole,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: `User role changed to ${newRole}` });
    } catch (error) {
        console.error('Error changing role:', error);
        res.status(500).json({ error: error.message || 'Failed to change role' });
    }
});

/**
 * POST /add-to-group
 */
app.post('/add-to-group', verifyToken, async (req, res) => {
    try {
        const { userId, groupId } = req.body;

        if (!userId || !groupId) {
            return res.status(400).json({ error: 'userId and groupId are required' });
        }

        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const groupIds = userData.groupIds || [];
        
        if (!groupIds.includes(groupId)) {
            groupIds.push(groupId);
            await db.collection('users').doc(userId).update({
                groupIds: groupIds,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.json({ message: 'User added to group', groupIds: groupIds });
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ error: error.message || 'Failed to add user to group' });
    }
});

/**
 * POST /remove-from-group
 */
app.post('/remove-from-group', verifyToken, async (req, res) => {
    try {
        const { userId, groupId } = req.body;

        if (!userId || !groupId) {
            return res.status(400).json({ error: 'userId and groupId are required' });
        }

        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const groupIds = (userData.groupIds || []).filter(id => id !== groupId);

        await db.collection('users').doc(userId).update({
            groupIds: groupIds,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'User removed from group', groupIds: groupIds });
    } catch (error) {
        console.error('Error removing user from group:', error);
        res.status(500).json({ error: error.message || 'Failed to remove user from group' });
    }
});

/**
 * GET /users
 */
app.get('/users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admins can list all users' });
        }

        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const db = admin.firestore();
        const usersSnapshot = await db.collection('users')
            .limit(limit)
            .offset(offset)
            .get();

        const users = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));

        res.json({ 
            users, 
            pagination: {
                page,
                limit,
                total: users.length
            }
        });
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: error.message || 'Failed to list users' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

app.listen(PORT, () => {
    console.log(`\n Auth Service running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API Key: ${FIREBASE_API_KEY ? ' Configured' : ' Missing'}\n`);
});

module.exports = app;
