import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8hdwdxdMUT6eCX_o_G2NNeM44LzcrLys",
  authDomain: "events-updates.firebaseapp.com",
  projectId: "events-updates",
  storageBucket: "events-updates.firebasestorage.app",
  messagingSenderId: "879558121138",
  appId: "1:879558121138:web:e3f61a54a80b448b651bab",
  measurementId: "G-NR7BYHNYPH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 