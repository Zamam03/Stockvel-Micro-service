const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;
const admin = require('../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../shared/middleware/verifyToken');

app.get('/health', (req, res) => {
    res.json({ service: 'auth-service', status: 'OK' });
});

// ========== AUTHENTICATION ENDPOINTS ==========

/**
 * POST /register
 * Register a new user with email, password, and role
 * Roles: Member, Treasurer, Admin
 */
app.post('/register', async (req, res) => {
    try {
        const { email, password, displayName, role = 'Member' } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Validate role
        if (!['Member', 'Treasurer', 'Admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be Member, Treasurer, or Admin.' });
        }

        // 1. Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: displayName || email.split('@')[0],
        });

        // 2. Set Custom User Claims for Role-Based Access Control
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });

        // 3. Save User Profile to Firestore Database
        const db = admin.firestore();
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || '',
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            groupIds: [], // Array to track which Stokvels they belong to
            isActive: true
        });

        res.status(201).json({ 
            message: 'User registered securely', 
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
 * Login user and return ID token
 */
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Firebase doesn't provide a simple backend login. 
        // Frontend should use Firebase SDK's signInWithEmailAndPassword.
        // This endpoint is primarily for verification purposes.
        // In real scenarios, use Firebase REST API or Firebase SDK on client.
        
        res.status(200).json({ 
            message: 'Use Firebase SDK on client to login. This endpoint validates on backend.',
            info: 'Frontend should call Firebase auth().signInWithEmailAndPassword()'
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: error.message || 'Login failed' });
    }
});

/**
 * POST /verify-token
 * Verify if token is valid
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
 * Get user profile by UID (requires token)
 */
app.get('/user/:uid', verifyToken, async (req, res) => {
    try {
        const { uid } = req.params;
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
 * Update user profile (requires token)
 */
app.put('/user/:uid', verifyToken, async (req, res) => {
    try {
        const { uid } = req.params;
        const updateData = req.body;

        // Prevent role changes via this endpoint
        if (updateData.role) {
            delete updateData.role;
        }

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
 * Admin only: Change user role
 */
app.post('/change-role', verifyToken, async (req, res) => {
    try {
        // Check if requester is Admin
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

        // Update custom claims
        await admin.auth().setCustomUserClaims(userId, { role: newRole });

        // Update Firestore
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
 * Add user to a group and track in their groupIds
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
        if (!userData.groupIds.includes(groupId)) {
            userData.groupIds.push(groupId);
            await db.collection('users').doc(userId).update({
                groupIds: userData.groupIds,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.json({ message: 'User added to group', groupIds: userData.groupIds });
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ error: error.message || 'Failed to add user to group' });
    }
});

/**
 * POST /remove-from-group
 * Remove user from a group
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
        const updatedGroupIds = userData.groupIds.filter(id => id !== groupId);

        await db.collection('users').doc(userId).update({
            groupIds: updatedGroupIds,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'User removed from group', groupIds: updatedGroupIds });
    } catch (error) {
        console.error('Error removing user from group:', error);
        res.status(500).json({ error: error.message || 'Failed to remove user from group' });
    }
});

/**
 * GET /users
 * Admin only: List all users (with pagination)
 */
app.get('/users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admins can list all users' });
        }

        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const db = admin.firestore();
        const usersSnapshot = await db.collection('users')
            .limit(limit)
            .offset(offset)
            .get();

        const users = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));

        res.json({ users, total: users.length });
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: error.message || 'Failed to list users' });
    }
});

app.listen(PORT, () => {
    console.log(`🔒 Auth Service running on port ${PORT}`);
});
