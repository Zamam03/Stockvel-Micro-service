const https = require('https');
const http = require('http');

async function makeRequest(url, options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testPayment() {
    try {
        console.log('1. Getting token from auth service...');
        const loginRes = await makeRequest('http://localhost:4001/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'paymentuser@example.com',
            password: 'Payment123!'
        });
        
        const token = loginRes.idToken;
        console.log('âœ… Token obtained');
        
        // Create a group using Firebase Admin
        const admin = require('firebase-admin');
        const serviceAccount = require('../../../shared/firebase/firebaseServiceAccountKey.json');
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        
        const db = admin.firestore();
        const groupRef = await db.collection('groups').add({
            groupName: 'Simple Test Group',
            createdBy: loginRes.localId,
            members: [loginRes.localId],
            currency: 'ZAR',
            createdAt: new Date()
        });
        const groupId = groupRef.id;
        console.log('âœ… Group created:', groupId);
        
        // Make a contribution
        console.log('\n2. Making contribution...');
        const contribRes = await makeRequest('http://localhost:4002/contribute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, {
            groupId: groupId,
            amount: 500,
            paymentMethod: 'credit_card',
            paymentDetails: { cardLast4: '4242', cardBrand: 'Visa' }
        });
        
        console.log('âœ… Contribution successful!');
        console.log('   Amount:', contribRes.amount);
        console.log('   Transaction ID:', contribRes.transactionId);
        
        // Get user contributions
        console.log('\n3. Getting user contributions...');
        const userContribRes = await makeRequest(`http://localhost:4002/user-contributions/${loginRes.localId}/${groupId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('âœ… Total contributed:', userContribRes.totalContributed);
        
        console.log('\ní¾‰ Payment service test completed!');
        console.log(`Group ID: ${groupId}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testPayment();
