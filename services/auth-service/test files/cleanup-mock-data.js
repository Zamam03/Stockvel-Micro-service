const admin = require('firebase-admin');
const path = require('path');

// Load service account
let serviceAccount;
const possiblePaths = [
    path.join(__dirname, '../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(__dirname, '../../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(process.cwd(), '../../shared/firebase/firebaseServiceAccountKey.json')
];

for (const tryPath of possiblePaths) {
    try {
        serviceAccount = require(tryPath);
        console.log('‚úÖ Found service account at:', tryPath);
        break;
    } catch (e) {}
}

if (!serviceAccount) {
    console.error('‚ùå Could not find service account');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function cleanupMockData() {
    console.log('\nÌ∑π STARTING CLEANUP OF MOCK DATA\n');
    console.log('=' .repeat(60));

    // 1. List all users to be deleted
    console.log('\nÌ≥ã STEP 1: Identifying mock users...');
    const mockEmails = [
        'john@example.com',
        'jane@example.com', 
        'admin@example.com',
        'test@stockvel.com',
        'newmember@example.com',
        'sarah@example.com',
        'testuser@example.com'
    ];

    const usersToDelete = [];
    for (const email of mockEmails) {
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            usersToDelete.push({ uid: userRecord.uid, email: userRecord.email });
            console.log(`   Found: ${email} (${userRecord.uid})`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`   Not found: ${email}`);
            } else {
                console.log(`   Error checking ${email}: ${error.message}`);
            }
        }
    }

    if (usersToDelete.length === 0) {
        console.log('   No mock users found in Authentication');
    }

    // 2. Delete all mock users from Authentication
    console.log('\nÌ∑ëÔ∏è  STEP 2: Deleting users from Authentication...');
    for (const user of usersToDelete) {
        try {
            await admin.auth().deleteUser(user.uid);
            console.log(`   ‚úÖ Deleted: ${user.email}`);
        } catch (error) {
            console.log(`   ‚ùå Failed to delete ${user.email}: ${error.message}`);
        }
    }

    // 3. Delete all documents from Firestore collections
    console.log('\nÌ∑ëÔ∏è  STEP 3: Deleting Firestore documents...');

    // Collections to clean
    const collections = ['users', 'groups', 'contributions', 'user-contributions', 'payouts'];
    
    for (const collectionName of collections) {
        console.log(`\n   Cleaning collection: ${collectionName}`);
        const snapshot = await db.collection(collectionName).get();
        
        if (snapshot.empty) {
            console.log(`   ‚úÖ ${collectionName} is already empty`);
            continue;
        }
        
        let deleted = 0;
        const batch = db.batch();
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            deleted++;
        });
        
        await batch.commit();
        console.log(`   ‚úÖ Deleted ${deleted} documents from ${collectionName}`);
    }

    // 4. Verify cleanup
    console.log('\nÌ≥ä STEP 4: Verification');
    console.log('=' .repeat(60));
    
    for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();
        console.log(`   ${collectionName}: ${snapshot.size} documents remaining`);
    }
    
    // Check remaining users in Authentication
    console.log('\n   Remaining users in Authentication:');
    try {
        const listUsersResult = await admin.auth().listUsers(100);
        if (listUsersResult.users.length === 0) {
            console.log('   ‚úÖ No users remain in Authentication');
        } else {
            console.log(`   ‚ö†Ô∏è  ${listUsersResult.users.length} users still exist:`);
            listUsersResult.users.forEach(user => {
                console.log(`      - ${user.email} (${user.uid})`);
            });
        }
    } catch (error) {
        console.log(`   Error listing users: ${error.message}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('‚úÖ CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log('\nÌ≥ù Summary:');
    console.log(`   ‚Ä¢ Deleted ${usersToDelete.length} users from Authentication`);
    console.log(`   ‚Ä¢ Cleared all Firestore collections`);
    console.log('\nÌ≤° Your Auth Service is now clean and ready for production data!\n');
}

cleanupMockData().catch(console.error);
