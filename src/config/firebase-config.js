require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, setPersistence, browserLocalPersistence } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configure Auth Persistence - Keep user signed in across app restarts
const initializeAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Firebase Auth persistence configured');
  } catch (error) {
    console.warn('⚠️ Failed to set auth persistence:', error.message);
    // Continue anyway - Firebase has default persistence
  }
};

// Initialize persistence immediately
initializeAuthPersistence();

module.exports = { auth, app, db }; 