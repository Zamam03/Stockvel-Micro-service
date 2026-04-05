require('dotenv').config({ path: './.env' });
console.log('Direct require:', require('dotenv').config({ path: './.env' }));
console.log('API Key:', process.env.VITE_FIREBASE_API_KEY);
console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('VITE')));
