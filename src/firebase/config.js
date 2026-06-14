import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB8MtkJeF4G7JBXUdIkqSI7ciEaW68ZxpI",
  authDomain: "noticeboard-ai.firebaseapp.com",
  projectId: "noticeboard-ai",
  storageBucket: "noticeboard-ai.firebasestorage.app",
  messagingSenderId: "103870395307",
  appId: "1:103870395307:web:ced65448604be75ad018ee",
  measurementId: "G-QPDN0ECK20"
};

const isConfigValid = true;

let app, auth, googleProvider, db, storage;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { app, auth, googleProvider, db, storage, isConfigValid };
export default app;
