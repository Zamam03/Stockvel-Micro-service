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
        console.log('‚úÖ Found service account at:', tryPath);
        break;
    } catch (e) {
        // Continue trying
    }
}

if (!serviceAccount) {
    console.error('‚ùå Could not find firebaseServiceAccountKey.json');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function createTestGroup() {
    try {
        const db = admin.firestore();
        
        // Get the test user
        const userEmail = 'test@stockvel.com';
        let createdBy;
        
        try {
            const userRecord = await admin.auth().getUserByEmail(userEmail);
            createdBy = userRecord.uid;
            console.log('\n‚úÖ Using existing user:', userRecord.email, 'UID:', createdBy);
        } catch (error) {
            console.log('\nÌ≥ù Test user not found. Creating one...');
            const userRecord = await admin.auth().createUser({
                email: userEmail,
                password: 'Test123!@#',
                displayName: 'Test User',
                emailVerified: true
            });
            createdBy = userRecord.uid;
            console.log('‚úÖ Created test user:', createdBy);
            
            // Assign admin role
            await admin.auth().setCustomUserClaims(createdBy, { role: 'Admin' });
            console.log('‚úÖ Admin role assigned');
        }
        
        const testGroup = {
            groupName: 'Test Investment Group',
            description: 'A test group for analytics',
            createdBy: createdBy,
            memberCount: 5,
            contributionAmount: 1000,
            meetingFrequency: 'monthly',
            startDate: admin.firestore.Timestamp.now(),
            status: 'active',
            targetFund: 50000,
            expectedContributionsPerMember: 12,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };
        
        const docRef = await db.collection('groups').add(testGroup);
        console.log('\n‚úÖ Test group created successfully!');
        console.log('Ì≥ã Group ID:', docRef.id);
        console.log('Ì≥ã Group Name:', testGroup.groupName);
        
        // Add user-contributions record
        const userContribRef = docRef.id;
        await db.collection('user-contributions').doc(`${createdBy}_${docRef.id}`).set({
            userId: createdBy,
            groupId: docRef.id,
            totalContributed: 3000,
            contributionCount: 3,
            lastContributionDate: admin.firestore.Timestamp.now()
        });
        
        console.log('‚úÖ Added user-contributions record');
        
        // Add sample contributions
        const contributions = [
            { amount: 1000, status: 'completed' },
            { amount: 1000, status: 'completed' },
            { amount: 1000, status: 'completed' }
        ];
        
        for (let i = 0; i < contributions.length; i++) {
            await db.collection('contributions').add({
                groupId: docRef.id,
                userId: createdBy,
                amount: contributions[i].amount,
                status: contributions[i].status,
                createdAt: admin.firestore.Timestamp.now()
            });
        }
        
        console.log('‚úÖ Added 3 sample contributions');
        console.log('\nÌ¥ó Use this Group ID for testing:', docRef.id);
        
        // Get a token for testing
        console.log('\nÌ≥ù To get a test token, run this command:');
        console.log(`curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDc6aLapSsquXB1GMWAlu3qVJvijhkobIs" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"email":"test@stockvel.com","password":"Test123!@#","returnSecureToken":true}'`);
        
        console.log('\nÌ≥ù Then test your endpoint:');
        console.log(`curl -X GET "http://localhost:4005/dashboard/${docRef.id}/contribution-compliance" \\`);
        console.log(`  -H "Authorization: Bearer YOUR_TOKEN"`);
        
    } catch (error) {
        console.error('\n‚ùå Error:', error.message);
        if (error.message.includes('Firestore')) {
            console.log('\n‚ö†Ô∏è Make sure Firestore is enabled in your Firebase Console');
        }
    }
}

createTestGroup();
