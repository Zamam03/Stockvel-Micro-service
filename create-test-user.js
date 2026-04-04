const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./shared/firebase/firebaseServiceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function createTestUser() {
    try {
        const email = 'test@stockvel.com';
        const password = 'Test123!@#';
        
        // Create user
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: 'Test User',
            emailVerified: true
        });
        
        console.log(' Test user created successfully!');
        console.log('UID:', userRecord.uid);
        console.log('Email:', userRecord.email);
        console.log('\n Use these credentials to login:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        
        // Set custom claims (Admin role for testing)
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: 'Admin'
        });
        console.log('\n Admin role assigned to user');
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.message.includes('EMAIL_EXISTS')) {
            console.log('\nUser already exists! You can login with existing credentials.');
        }
    }
}

createTestUser();