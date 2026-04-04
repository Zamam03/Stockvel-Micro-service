const admin = require('firebase-admin');
const path = require('path');

// Try multiple possible paths for the service account
let serviceAccount;
const possiblePaths = [
    path.join(__dirname, '../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(__dirname, '../../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(process.cwd(), 'shared/firebase/firebaseServiceAccountKey.json'),
    path.join(process.cwd(), '../../shared/firebase/firebaseServiceAccountKey.json')
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
    console.error('Tried paths:', possiblePaths);
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function cleanupTestData() {
    console.log('\nÌ∑π Starting Cleanup of Test Data...\n');
    
    // Get the test group ID
    const groupsSnapshot = await db.collection('groups')
        .where('groupName', '==', 'Test Investment Group')
        .get();
    
    const testGroupIds = [];
    groupsSnapshot.forEach(doc => {
        testGroupIds.push(doc.id);
        console.log(`Found test group: ${doc.id} - ${doc.data().groupName}`);
    });
    
    if (testGroupIds.length === 0) {
        console.log('‚ö†Ô∏è No test groups found with name "Test Investment Group"');
    }
    
    // 1. Delete all contributions for test groups
    console.log('\nÌ≥ù Deleting contributions...');
    for (const groupId of testGroupIds) {
        const contributionsSnapshot = await db.collection('contributions')
            .where('groupId', '==', groupId)
            .get();
        
        let deleted = 0;
        for (const doc of contributionsSnapshot.docs) {
            await doc.ref.delete();
            deleted++;
        }
        console.log(`   ‚úÖ Deleted ${deleted} contributions for group ${groupId}`);
    }
    
    // 2. Delete user-contributions for test groups
    console.log('\nÌ≥ù Deleting user-contributions...');
    for (const groupId of testGroupIds) {
        const userContribsSnapshot = await db.collection('user-contributions')
            .where('groupId', '==', groupId)
            .get();
        
        let deleted = 0;
        for (const doc of userContribsSnapshot.docs) {
            await doc.ref.delete();
            deleted++;
        }
        console.log(`   ‚úÖ Deleted ${deleted} user-contributions for group ${groupId}`);
    }
    
    // 3. Delete payouts for test groups
    console.log('\nÌ≥ù Deleting payouts...');
    for (const groupId of testGroupIds) {
        const payoutsSnapshot = await db.collection('payouts')
            .where('groupId', '==', groupId)
            .get();
        
        let deleted = 0;
        for (const doc of payoutsSnapshot.docs) {
            await doc.ref.delete();
            deleted++;
        }
        console.log(`   ‚úÖ Deleted ${deleted} payouts for group ${groupId}`);
    }
    
    // 4. Delete test groups
    console.log('\nÌ≥ù Deleting test groups...');
    for (const groupId of testGroupIds) {
        await db.collection('groups').doc(groupId).delete();
        console.log(`   ‚úÖ Deleted group: ${groupId}`);
    }
    
    // 5. Delete test user document from Firestore
    console.log('\nÌ≥ù Deleting test user document from Firestore...');
    const testUserEmail = 'test@stockvel.com';
    try {
        const userRecord = await admin.auth().getUserByEmail(testUserEmail);
        const userId = userRecord.uid;
        
        // Delete user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            await db.collection('users').doc(userId).delete();
            console.log(`   ‚úÖ Deleted user document: ${userId}`);
        } else {
            console.log(`   ‚úÖ User document already deleted or doesn't exist`);
        }
        
        console.log(`\n‚ö†Ô∏è  IMPORTANT: The Firebase Auth user (${testUserEmail}) still exists.`);
        console.log('   To delete the actual user account, run this command:');
        console.log(`   node delete-test-user.js`);
        
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log('   ‚úÖ Test user not found in Authentication');
        } else {
            console.log(`   ‚ö†Ô∏è Could not delete user document: ${error.message}`);
        }
    }
    
    console.log('\n‚úÖ Cleanup completed!\n');
    
    // Show remaining data
    console.log('Ì≥ä Remaining data in Firestore:');
    const remainingGroups = await db.collection('groups').get();
    console.log(`   Groups: ${remainingGroups.size}`);
    
    const remainingContributions = await db.collection('contributions').get();
    console.log(`   Contributions: ${remainingContributions.size}`);
    
    const remainingUsers = await db.collection('users').get();
    console.log(`   Users: ${remainingUsers.size}`);
}

cleanupTestData().catch(console.error);
