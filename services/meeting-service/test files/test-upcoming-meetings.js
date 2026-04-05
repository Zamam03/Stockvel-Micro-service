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

async function testUpcomingMeetings() {
    try {
        console.log('\n========================================');
        console.log('TESTING UPCOMING MEETINGS ENDPOINT');
        console.log('========================================\n');
        
        // Login
        const loginRes = await axios.post('http://localhost:4001/login', {
            email: 'meetinguser@example.com',
            password: 'Meeting123!'
        });
        const token = loginRes.data.idToken;
        console.log('✅ Token obtained\n');
        
        // Create a group
        const groupRef = await db.collection('groups').add({
            name: 'Upcoming Test Group',
            createdBy: loginRes.data.localId,
            members: [loginRes.data.localId],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const groupId = groupRef.id;
        console.log(`✅ Group created: ${groupId}\n`);
        
        // Create a future meeting (should appear in upcoming)
        console.log('Creating future meeting (May 25, 2026)...');
        const futureRes = await axios.post('http://localhost:4004/meetings', {
            groupId: groupId,
            title: 'Future Meeting',
            description: 'This meeting is in the future',
            scheduledDate: '2026-05-25T10:00:00.000Z',
            location: 'Online',
            meetingType: 'general'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✅ Created: ${futureRes.data.meetingId}\n`);
        
        // Create a past meeting (should NOT appear in upcoming)
        console.log('Creating past meeting (April 1, 2026)...');
        const pastRes = await axios.post('http://localhost:4004/meetings', {
            groupId: groupId,
            title: 'Past Meeting',
            description: 'This meeting is in the past',
            scheduledDate: '2026-04-01T10:00:00.000Z',
            location: 'Online',
            meetingType: 'general'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✅ Created: ${pastRes.data.meetingId}\n`);
        
        // Create a cancelled meeting (should NOT appear in upcoming)
        console.log('Creating cancelled meeting...');
        const cancelledRes = await axios.post('http://localhost:4004/meetings', {
            groupId: groupId,
            title: 'Cancelled Meeting',
            description: 'This meeting was cancelled',
            scheduledDate: '2026-05-20T10:00:00.000Z',
            location: 'Online',
            meetingType: 'general'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const cancelledId = cancelledRes.data.meetingId;
        console.log(`   ✅ Created: ${cancelledId}\n`);
        
        // Cancel the meeting
        await axios.put(`http://localhost:4004/meetings/${cancelledId}/status`, {
            status: 'cancelled'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Meeting cancelled\n');
        
        // Test upcoming meetings endpoint
        console.log('=== TESTING UPCOMING MEETINGS ===');
        try {
            const upcomingRes = await axios.get(`http://localhost:4004/meetings/group/${groupId}/upcoming`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log(`\n✅ Upcoming meetings found: ${upcomingRes.data.total}`);
            if (upcomingRes.data.meetings && upcomingRes.data.meetings.length > 0) {
                upcomingRes.data.meetings.forEach(meeting => {
                    console.log(`   - ${meeting.title} (${meeting.status})`);
                });
            }
            
            // Verify correct meetings are returned
            const hasFuture = upcomingRes.data.meetings.some(m => m.title === 'Future Meeting');
            const hasPast = upcomingRes.data.meetings.some(m => m.title === 'Past Meeting');
            const hasCancelled = upcomingRes.data.meetings.some(m => m.title === 'Cancelled Meeting');
            
            console.log('\n��� Verification:');
            console.log(`   Future meeting included: ${hasFuture ? '✅' : '❌'}`);
            console.log(`   Past meeting excluded: ${!hasPast ? '✅' : '❌'}`);
            console.log(`   Cancelled meeting excluded: ${!hasCancelled ? '✅' : '❌'}`);
            
            if (hasFuture && !hasPast && !hasCancelled) {
                console.log('\n��� UPCOMING MEETINGS ENDPOINT IS WORKING CORRECTLY!');
            }
            
        } catch (error) {
            if (error.response?.data?.error?.includes('index')) {
                console.log('\n⚠️  Index is still building. Please wait 2-5 minutes and try again.');
                console.log('Create the index using the URL in the error message');
            } else {
                console.error('Error:', error.response?.data?.error || error.message);
            }
        }
        
        console.log('\n========================================');
        
    } catch (error) {
        console.error('Error:', error.response?.data?.error || error.message);
    }
}

testUpcomingMeetings();
