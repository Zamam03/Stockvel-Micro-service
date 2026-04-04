const admin = require('firebase-admin');
const path = require('path');

// Try multiple possible paths for the service account
let serviceAccount;
const possiblePaths = [
    path.join(__dirname, '../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(__dirname, '../../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(process.cwd(), 'shared/firebase/firebaseServiceAccountKey.json')
];

for (const tryPath of possiblePaths) {
    try {
        serviceAccount = require(tryPath);
        console.log('✅ Found service account at:', tryPath);
        break;
    } catch (e) {
        // Continue trying
    }
}

if (!serviceAccount) {
    console.error('❌ Could not find firebaseServiceAccountKey.json');
    console.error('Tried paths:', possiblePaths);
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function createTestUser() {
    try {
        const email = 'test@stockvel.com';
        const password = 'Test123!@#';
        
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: 'Test User',
            emailVerified: true
        });
        
        console.log('\n✅ Test user created successfully!');
        console.log('UID:', userRecord.uid);
        console.log('Email:', userRecord.email);
        console.log('\n��� Login credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'Admin' });
        console.log('\n✅ Admin role assigned to user');
        
    } catch (error) {
        if (error.message.includes('EMAIL_EXISTS')) {
            console.log('\n⚠️ User already exists!');
            try {
                const userRecord = await admin.auth().getUserByEmail('test@stockvel.com');
                console.log('UID:', userRecord.uid);
            } catch (e) {
                console.log('Could not fetch user details');
            }
        } else {
            console.error('Error:', error.message);
        }
    }
}

createTestUser();
