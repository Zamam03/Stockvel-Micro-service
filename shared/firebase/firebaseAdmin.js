const admin = require('firebase-admin');

// PLACEHOLDER: Ensure you have your firebaseServiceAccountKey.json 
// in the root of the service using this, or pass it via ENV.
let serviceAccount;
try {
    serviceAccount = require('./firebaseServiceAccountKey.json');
} catch (e) {
    console.warn("⚠️ Firebase Service Account Key not found. Please follow the Firebase Setup Guide.");
    // Dummy credential for avoiding immediate crash during scaffolding
    serviceAccount = {
        projectId: "demo-project",
        clientEmail: "demo@demo.iam.gserviceaccount.com",
        privateKey: "-----BEGIN PRIVATE KEY-----\nFakeKey\n-----END PRIVATE KEY-----\n"
    };
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;
