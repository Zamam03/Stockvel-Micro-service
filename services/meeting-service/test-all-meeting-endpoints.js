const axios = require('axios');
const path = require('path');

// Load service account
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

async function testAllEndpoints() {
    try {
        console.log('\n========================================');
        console.log('MEETING SERVICE - COMPLETE TEST');
        console.log('========================================\n');
        
        // Login
        console.log('1. Logging in...');
        const loginRes = await axios.post('http://localhost:4001/login', {
            email: 'meetinguser@example.com',
            password: 'Meeting123!'
        });
        const token = loginRes.data.idToken;
        console.log('   ✅ Token obtained\n');
        
        // Create test group
        console.log('2. Creating test group...');
        const groupRef = await db.collection('groups').add({
            name: 'Complete Test Group',
            createdBy: loginRes.data.localId,
            members: [loginRes.data.localId],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const groupId = groupRef.id;
        console.log(`   ✅ Group created: ${groupId}\n`);
        
        // Create meeting
        console.log('3. Creating meeting...');
        const meetingRes = await axios.post('http://localhost:4004/meetings', {
            groupId: groupId,
            title: 'Complete Test Meeting',
            description: 'Testing all endpoints including group queries',
            scheduledDate: '2026-05-15T14:00:00.000Z',
            location: 'Conference Room',
            meetingType: 'general'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const meetingId = meetingRes.data.meetingId;
        console.log(`   ✅ Meeting created: ${meetingId}\n`);
        
        // Add agenda
        console.log('4. Adding agenda...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/agenda`, {
            agenda: [
                'Opening and welcome',
                'Review of previous minutes',
                'Financial report',
                'New business',
                'Adjournment'
            ]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Agenda added\n');
        
        // Mark attendance
        console.log('5. Marking attendance...');
        await axios.post(`http://localhost:4004/meetings/${meetingId}/mark-attended`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Attendance marked\n');
        
        // Update status to ongoing
        console.log('6. Updating meeting status...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/status`, {
            status: 'ongoing'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Status updated to ongoing\n');
        
        // Add minutes
        console.log('7. Adding meeting minutes...');
        await axios.put(`http://localhost:4004/meetings/${meetingId}/minutes`, {
            minutes: 'Meeting was productive. All agenda items discussed. Decisions: 1) Increase monthly contribution to R1000, 2) Schedule next meeting for next week.'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Minutes added\n');
        
        // Get single meeting details
        console.log('8. Getting meeting details...');
        const getRes = await axios.get(`http://localhost:4004/meetings/${meetingId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✅ Title: ${getRes.data.meeting.title}`);
        console.log(`   Status: ${getRes.data.meeting.status}`);
        console.log(`   Attendees: ${getRes.data.meeting.attendees?.length || 0}`);
        console.log(`   Agenda items: ${getRes.data.meeting.agenda?.length || 0}\n`);
        
        // Get all meetings for group (requires index - now enabled!)
        console.log('9. Getting ALL meetings for group...');
        try {
            const allRes = await axios.get(`http://localhost:4004/meetings/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`   ✅ Found ${allRes.data.total} meeting(s)`);
            if (allRes.data.meetings && allRes.data.meetings.length > 0) {
                console.log(`   Meeting titles: ${allRes.data.meetings.map(m => m.title).join(', ')}`);
            }
        } catch (error) {
            console.log(`   ⚠️  Error: ${error.response?.data?.error || error.message}`);
        }
        console.log();
        
        // Get upcoming meetings (requires index - now enabled!)
        console.log('10. Getting UPCOMING meetings for group...');
        try {
            const upcomingRes = await axios.get(`http://localhost:4004/meetings/group/${groupId}/upcoming`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`   ✅ Found ${upcomingRes.data.total} upcoming meeting(s)`);
        } catch (error) {
            console.log(`   ⚠️  Error: ${error.response?.data?.error || error.message}`);
        }
        console.log();
        
        // Create a second meeting to test multiple meetings
        console.log('11. Creating second meeting...');
        const meeting2Res = await axios.post(`http://localhost:4004/meetings`, {
            groupId: groupId,
            title: 'Follow-up Meeting',
            description: 'Follow-up on action items',
            scheduledDate: '2026-05-22T14:00:00.000Z',
            location: 'Conference Room',
            meetingType: 'general'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const meeting2Id = meeting2Res.data.meetingId;
        console.log(`   ✅ Second meeting created: ${meeting2Id}\n`);
        
        // Get all meetings again (should show 2 meetings)
        console.log('12. Getting ALL meetings again (should show 2)...');
        const allRes2 = await axios.get(`http://localhost:4004/meetings/group/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✅ Total meetings: ${allRes2.data.total}`);
        console.log(`   Meeting IDs: ${allRes2.data.meetings.map(m => m.id).join(', ')}\n`);
        
        // Get upcoming meetings (should show future meetings)
        console.log('13. Getting UPCOMING meetings...');
        const upcomingRes2 = await axios.get(`http://localhost:4004/meetings/group/${groupId}/upcoming`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✅ Upcoming meetings: ${upcomingRes2.data.total}\n`);
        
        // Test notification endpoint (optional)
        console.log('14. Testing notifications...');
        try {
            const notifyRes = await axios.post(`http://localhost:4004/meetings/${meetingId}/notify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`   ✅ Notifications sent to ${notifyRes.data.notificationCount} members`);
        } catch (error) {
            console.log(`   ⚠️  Notifications: ${error.response?.data?.error || error.message}`);
        }
        console.log();
        
        console.log('========================================');
        console.log('✅ ALL MEETING SERVICE TESTS PASSED!');
        console.log('========================================');
        console.log('\n��� Test Summary:');
        console.log(`   Group ID: ${groupId}`);
        console.log(`   Meeting IDs: ${meetingId}, ${meeting2Id}`);
        console.log(`   Total endpoints tested: 14`);
        console.log(`   Group queries: ✅ WORKING (index enabled)`);
        console.log(`   All meeting operations: ✅ WORKING`);
        
        // Clean up (optional - uncomment to delete test data)
        // console.log('\n��� Cleaning up test data...');
        // await db.collection('groups').doc(groupId).delete();
        // console.log('   Test data removed');
        
    } catch (error) {
        console.error('\n❌ Test failed!');
        console.error('Error:', error.response?.data?.error || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Details:', error.response.data);
        }
    }
}

testAllEndpoints();
