const admin = require('firebase-admin');
const path = require('path');

// Try to load service account from multiple locations
let serviceAccount;
let initialized = false;

// Method 1: Try loading from same directory
try {
    serviceAccount = require('./firebaseServiceAccountKey.json');
    console.log('Firebase: Loaded key from ./firebaseServiceAccountKey.json');
} catch (e) {
    console.warn('Firebase: No local key file found in current directory');
    
    // Method 2: Try environment variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log('Firebase: Using GOOGLE_APPLICATION_CREDENTIALS env var');
        serviceAccount = null; // Will use default credentials
    } else {
        console.error('Firebase: No valid credentials found');
        // Don't create dummy credentials - fail fast
        throw new Error('Firebase Admin SDK requires valid credentials');
    }
}

if (!admin.apps.length) {
    try {
        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            admin.initializeApp();
        }
        console.log('Firebase Admin SDK initialized successfully');
        console.log('   Project ID:', admin.apps[0]?.options?.credential?.projectId || 'from env');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error.message);
        throw error;
    }
}

module.exports = admin;