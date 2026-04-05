const admin = require('firebase-admin');
const serviceAccount = require('../../../shared/firebase/firebaseServiceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function createTestGroup() {
    try {
        const groupRef = await db.collection('groups').add({
            groupName: 'Weekly Savings Stokvel',
            description: 'A group for weekly contributions',
            createdBy: 'meetinguser@example.com',
            members: ['meetinguser@example.com'],
            memberCount: 1,
            contributionAmount: 500,
            meetingFrequency: 'weekly',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(groupRef.id);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createTestGroup();
