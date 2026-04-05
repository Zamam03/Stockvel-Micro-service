const axios = require('axios');
const path = require('path');

let serviceAccount;
const possiblePaths = [
    path.join(__dirname, '../../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(__dirname, '../../shared/firebase/firebaseServiceAccountKey.json')
];

for (const tryPath of possiblePaths) {
    try {
        serviceAccount = require(tryPath);
        console.log('✅ Found service account');
        break;
    } catch (e) {}
}

const admin = require('firebase-admin');
if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function testWorkingEndpoints() {
    try {
        console.log('\n========================================');
        console.log('MEETING SERVICE - WORKING ENDPOINTS');
        console.log('========================================\n');
        
        // Login
        const loginRes = await axios.post('http://localhost:4001/login', {
            email: 'meetinguser@example.com',
            password: 'Meeting123!'
        });
        const token = loginRes.data.idToken;
        console.log('✅ Token obtained\n');
        
        // Create group
        const groupRef = await db.collection('groups').add({
            name: 'Working Test Group',
            createdBy: loginRes.data.localId,
            members: [loginRes.data.localId],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const groupId = groupRef.id;
        console.log(`✅ Group created: ${groupId}\n`);
        
        // Create meeting
        const meetingRes = await axios.post('http://localhost:4004/meetings', {
            groupId: groupId,
            title: 'Working Test Meeting',
            description: 'Testing working endpoints',
            scheduledDate: '2026-05-20T14:00:00.000Z',
            location: 'Online',
            meetingType: 'general'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const meetingId = meetingRes.data.meetingId;
        console.log(`✅ Meeting created: ${meetingId}\n`);
        
        // Test single meeting endpoints (all working)
        console.log('1. Get meeting details...');
        await axios.get(`http://localhost:4004/meetings/${meetingId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Working\n');
        
        console.log('2. Add agenda...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/agenda`, {
            agenda: ['Item 1', 'Item 2']
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Working\n');
        
        console.log('3. Mark attendance...');
        await axios.post(`http://localhost:4004/meetings/${meetingId}/mark-attended`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Working\n');
        
        console.log('4. Update status...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/status`, {
            status: 'ongoing'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Working\n');
        
        console.log('5. Add minutes...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/minutes`, {
            minutes: 'Test minutes'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Working\n');
        
        console.log('6. Get all meetings for group (simple query)...');
        const allRes = await axios.get(`http://localhost:4004/meetings/group/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✅ Working - Found ${allRes.data.total} meeting(s)\n`);
        
        console.log('========================================');
        console.log('✅ All basic endpoints working!');
        console.log('========================================');
        console.log('\n⚠️  Note: Upcoming meetings query needs composite index');
        console.log('   (groupId + status + scheduledDate)');
        console.log('\n��� Test Data:');
        console.log(`   Group ID: ${groupId}`);
        console.log(`   Meeting ID: ${meetingId}`);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data?.error || error.message);
    }
}

testWorkingEndpoints();
