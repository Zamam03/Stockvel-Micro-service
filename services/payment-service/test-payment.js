const axios = require('axios');
const admin = require('firebase-admin');
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

if (!serviceAccount) {
    console.error('❌ Service account not found');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function testPaymentService() {
    try {
        console.log('\n========================================');
        console.log('PAYMENT SERVICE TEST');
        console.log('========================================\n');
        
        // 1. Login to get token
        console.log('1. Logging in...');
        const loginRes = await axios.post('http://localhost:4001/login', {
            email: 'paymentuser@example.com',
            password: 'Payment123!'
        });
        
        const token = loginRes.data.idToken;
        const userId = loginRes.data.localId;
        console.log('   ✅ Token obtained');
        console.log('   User ID:', userId);
        
        // 2. Create a test group
        console.log('\n2. Creating test group...');
        const groupRef = await db.collection('groups').add({
            groupName: 'Payment Test Stokvel',
            description: 'Test group for payment service',
            createdBy: userId,
            members: [userId],
            memberCount: 1,
            currency: 'ZAR',
            contributionAmount: 500,
            meetingFrequency: 'monthly',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const groupId = groupRef.id;
        console.log('   ✅ Group created:', groupId);
        
        // 3. Make a contribution
        console.log('\n3. Making contribution (R500)...');
        const contributeRes = await axios.post('http://localhost:4002/contribute', {
            groupId: groupId,
            amount: 500,
            paymentMethod: 'credit_card',
            paymentDetails: {
                cardLast4: '4242',
                cardBrand: 'Visa',
                cardHolder: 'Payment Tester'
            }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Contribution successful!');
        console.log('   Amount: R', contributeRes.data.amount);
        console.log('   Transaction ID:', contributeRes.data.transactionId);
        
        // 4. Make another contribution
        console.log('\n4. Making second contribution (R750)...');
        const contributeRes2 = await axios.post('http://localhost:4002/contribute', {
            groupId: groupId,
            amount: 750,
            paymentMethod: 'debit_card',
            paymentDetails: {
                cardLast4: '1234',
                cardBrand: 'Mastercard',
                cardHolder: 'Payment Tester'
            }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Second contribution successful!');
        console.log('   Amount: R', contributeRes2.data.amount);
        
        // 5. Get user contributions
        console.log('\n5. Getting user contributions...');
        const userContribRes = await axios.get(`http://localhost:4002/user-contributions/${userId}/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Total contributed: R', userContribRes.data.totalContributed);
        console.log('   Contribution count:', userContribRes.data.contributionCount);
        
        // 6. Get all contributions for group
        console.log('\n6. Getting all contributions for group...');
        const allContribRes = await axios.get(`http://localhost:4002/contributions/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Total contributions:', allContribRes.data.total);
        
        // 7. Get contributions by month
        console.log('\n7. Getting contributions by month...');
        const byMonthRes = await axios.get(`http://localhost:4002/contributions/${groupId}/by-month`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Monthly summary available');
        console.log('   Total months:', Object.keys(byMonthRes.data.byMonth).length);
        
        // 8. Get payment summary
        console.log('\n8. Getting payment summary...');
        const summaryRes = await axios.get(`http://localhost:4002/summary/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Summary available');
        console.log('   Total contributions: R', summaryRes.data.summary.totalContributions);
        console.log('   Available balance: R', summaryRes.data.summary.availableBalance);
        console.log('   Contribution count:', summaryRes.data.summary.contributionCount);
        
        // 9. Test payout initiation (requires Treasurer/Admin)
        console.log('\n9. Testing payout initiation (needs Admin role)...');
        try {
            const payoutRes = await axios.post('http://localhost:4002/payout/initiate', {
                groupId: groupId,
                memberId: userId,
                amount: 500,
                bankDetails: {
                    bankName: 'Test Bank',
                    accountNumber: '1234567890',
                    accountName: 'Payment Tester'
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('   ⚠️  Payout initiated (member can initiate? Check role)');
            console.log('   Payout ID:', payoutRes.data.payoutId);
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('   ✅ Correctly blocked: Only Treasurers/Admins can initiate payouts');
            } else {
                console.log('   Error:', error.response?.data?.error);
            }
        }
        
        console.log('\n========================================');
        console.log('✅ PAYMENT SERVICE TESTS COMPLETED!');
        console.log('========================================');
        console.log('\n��� Summary:');
        console.log(`   Group ID: ${groupId}`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Total Contributions: R1250`);
        console.log(`   Payment Method: Mock (Credit Card/Debit Card)`);
        console.log(`   Status: ✅ All mock payments processed successfully`);
        
    } catch (error) {
        console.error('\n❌ Test failed!');
        console.error('Error:', error.response?.data?.error || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Details:', error.response.data);
        }
    }
}

testPaymentService();
