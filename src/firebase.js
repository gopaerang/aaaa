import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 환경 변수 (.env)가 우선 적용되며, 없을 경우 기본 프로젝트(ssss-52bbd) 설정값으로 fallback 됩니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDkAJcc7WmXCDjayMt9KaLqFT6YBy1I4Z8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ssss-52bbd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ssss-52bbd',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ssss-52bbd.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '611157701550',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:611157701550:web:f39055e952551f62c00e3f',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-EJ9T2N656C',
};

// Initialize Firebase safely
let app;
let auth;
let googleProvider;
let db;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export {
  app,
  auth,
  googleProvider,
  db,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  firebaseConfig
};
