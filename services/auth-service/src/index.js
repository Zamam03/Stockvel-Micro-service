const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;

app.get('/health', (req, res) => {
    res.json({ service: 'auth-service', status: 'OK' });
});

const admin = require('../../shared/firebase/firebaseAdmin');

app.post('/register', async (req, res) => {
    try {
        const { email, password, displayName, role = 'Member' } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 1. Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });

        // 2. Set Custom User Claims for Role-Based Access Control
        // The prompt defined 3 roles: Member, Treasurer, Admin.
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });

        // 3. Save User Profile to Firestore Database
        const db = admin.firestore();
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || '',
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            groupIds: [] // Array to track which Stokvels they belong to
        });

        res.status(201).json({ 
            message: 'User registered securely', 
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                role
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message || 'Failed to register user' });
    }
});

app.listen(PORT, () => {
    console.log(`🔒 Auth Service running on port ${PORT}`);
});
