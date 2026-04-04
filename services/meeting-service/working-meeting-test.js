const axios = require('axios');
const path = require('path');

// Try multiple paths for the service account
let serviceAccount;
const possiblePaths = [
    path.join(__dirname, '../../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(__dirname, '../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(process.cwd(), '../../shared/firebase/firebaseServiceAccountKey.json'),
    path.join(process.cwd(), '../../../shared/firebase/firebaseServiceAccountKey.json')
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
    console.error('❌ Could not find service account file');
    process.exit(1);
}

const admin = require('firebase-admin');
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function runTest() {
    try {
        console.log('\n========================================');
        console.log('MEETING SERVICE TEST');
        console.log('========================================\n');
        
        // Step 1: Login to get token
        console.log('1. Logging in to Auth Service...');
        const loginRes = await axios.post('http://localhost:4001/login', {
            email: 'meetinguser@example.com',
            password: 'Meeting123!'
        }).catch(e => {
            throw new Error(`Auth Service error: ${e.response?.data?.error || e.message}`);
        });
        
        const token = loginRes.data.idToken;
        console.log('   ✅ Token obtained\n');
        
        // Step 2: Create a test group
        console.log('2. Creating test group in Firestore...');
        const groupRef = await db.collection('groups').add({
            name: 'Meeting Test Group',
            createdBy: loginRes.data.localId,
            members: [loginRes.data.localId],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const groupId = groupRef.id;
        console.log(`   ✅ Group created: ${groupId}\n`);
        
        // Step 3: Create a meeting
        console.log('3. Creating meeting...');
        const meetingRes = await axios.post('http://localhost:4004/meetings', {
            groupId: groupId,
            title: 'Weekly Team Meeting',
            description: 'Discuss progress and plans',
            scheduledDate: '2026-04-25T15:00:00.000Z',
            location: 'Conference Room A',
            meetingType: 'general'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const meetingId = meetingRes.data.meetingId;
        console.log(`   ✅ Meeting created: ${meetingId}\n`);
        
        // Step 4: Add agenda
        console.log('4. Adding agenda...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/agenda`, {
            agenda: [
                'Opening remarks',
                'Review of action items',
                'Current status update',
                'Budget review',
                'New business',
                'Closing'
            ]
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('   ✅ Agenda added\n');
        
        // Step 5: Mark attendance
        console.log('5. Marking attendance...');
        await axios.post(`http://localhost:4004/meetings/${meetingId}/mark-attended`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('   ✅ Attendance marked\n');
        
        // Step 6: Update status
        console.log('6. Updating meeting status...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/status`, {
            status: 'ongoing'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('   ✅ Status updated to ongoing\n');
        
        // Step 7: Add minutes
        console.log('7. Adding meeting minutes...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/minutes`, {
            minutes: 'Meeting was productive. All members present. Decisions made to increase contributions.'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('   ✅ Minutes added\n');
        
        // Step 8: Get meeting details
        console.log('8. Retrieving meeting details...');
        const getRes = await axios.get(`http://localhost:4004/meetings/${meetingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   ✅ Meeting: ${getRes.data.meeting.title}`);
        console.log(`      Status: ${getRes.data.meeting.status}`);
        console.log(`      Attendees: ${getRes.data.meeting.attendees?.length || 0}\n`);
        
        // Step 9: Get all meetings for group
        console.log('9. Getting all meetings for group...');
        const allRes = await axios.get(`http://localhost:4004/meetings/group/${groupId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   ✅ Found ${allRes.data.total} meeting(s)\n`);
        
        // Step 10: Get upcoming meetings
        console.log('10. Getting upcoming meetings...');
        const upcomingRes = await axios.get(`http://localhost:4004/meetings/group/${groupId}/upcoming`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   ✅ Found ${upcomingRes.data.total} upcoming meeting(s)\n`);
        
        console.log('========================================');
        console.log('✅ ALL TESTS PASSED!');
        console.log('========================================');
        console.log(`\n��� Summary:`);
        console.log(`   Group ID: ${groupId}`);
        console.log(`   Meeting ID: ${meetingId}`);
        console.log(`   Meeting Status: ${getRes.data.meeting.status}`);
        
    } catch (error) {
        console.error('\n❌ Test failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Details:', error.response.data);
        }
    }
}

runTest();
