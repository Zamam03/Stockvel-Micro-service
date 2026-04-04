const axios = require('axios');

async function testAdmin() {
    try {
        // 1. Login as admin
        console.log('Ì≥ù Logging in as admin...');
        const loginRes = await axios.post('http://localhost:4001/login', {
            email: 'admin@example.com',
            password: 'SecurePass123!'
        });
        
        const token = loginRes.data.idToken;
        console.log('‚úÖ Token obtained');
        
        // 2. Decode token to see role
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('\nÌ≥ã Token payload:');
        console.log('   User ID:', payload.user_id);
        console.log('   Email:', payload.email);
        console.log('   Role from token:', payload.role);
        console.log('   Custom claims:', payload.role ? '‚úÖ Present' : '‚ùå Missing');
        
        // 3. Test verify token endpoint
        console.log('\nÌ¥ç Testing verify-token endpoint...');
        const verifyRes = await axios.post('http://localhost:4001/verify-token', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Verified user role:', verifyRes.data.user?.role);
        
        // 4. Test list users (admin only)
        console.log('\nÌ±• Testing list users endpoint...');
        try {
            const usersRes = await axios.get('http://localhost:4001/users?limit=10', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('‚úÖ Success! Found', usersRes.data.users?.length, 'users');
            console.log('   Users:', usersRes.data.users?.map(u => u.displayName).join(', '));
        } catch (error) {
            console.log('‚ùå Failed:', error.response?.data?.error || error.message);
        }
        
        // 5. Test change role
        console.log('\nÌ¥Ñ Testing change role endpoint...');
        try {
            const changeRes = await axios.post('http://localhost:4001/change-role', {
                userId: 'xpU3xTaCC3bciKTn15gnEbbT03r1',
                newRole: 'Treasurer'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('‚úÖ Success:', changeRes.data.message);
        } catch (error) {
            console.log('‚ùå Failed:', error.response?.data?.error || error.message);
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testAdmin();
