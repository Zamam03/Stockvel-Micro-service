# Firebase Setup Guide

Follow these steps to set up Firebase for your Stokvel Management Platform and replace the placeholders.

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or Create a project).
3. Name your project (e.g., `Stokvel-Platform`) and follow the on-screen steps.
4. (Optional) Disable Google Analytics for now unless you need it.

## 2. Enable Authentication
1. In the Firebase console's left sidebar, click **Authentication**, then click **Get started**.
2. Go to the **Sign-in method** tab.
3. Enable **Email/Password** and click Save.
4. (Optional) Enable **Google** sign-in if you want 3rd-party OAuth.

## 3. Enable Firestore Database
1. In the left sidebar, click **Firestore Database** and then click **Create database**.
2. Start in **Test mode** (for local development) to allow all reads/writes.
3. Choose a region close to you (e.g., `europe-west` or `us-central`) and complete the setup.

## 4. Get the Admin SDK Service Account Key (Backend)
This is required for your backend microservices to interact securely with Firebase.
1. In the top left, click the **Gear Icon (Project settings)** -> **Service accounts**.
2. Click **Generate new private key**.
3. A `.json` file will be downloaded. 
4. Rename this file to `firebaseServiceAccountKey.json`.
5. Place this file inside the `shared/firebase/` folder of this repository. **Do not commit this file to GitHub!** It is already in the global `.gitignore`.

## 5. Get the Web App Configuration (Frontend)
This is needed for your React application to connect.
1. Go to **Project settings** -> **General** tab.
2. Scroll to **Your apps**, choose the **Web** icon (`</>`).
3. Register the app (e.g., `stokvel-web`).
4. Copy the `firebaseConfig` object they provide.
5. In your React frontend (`frontend/`), create a `.env` file and populate it with these variables:
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```
6. The frontend will dynamically pick these up.

You're all set! Restart your Docker containers to apply the new keys.
