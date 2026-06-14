import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8MtkJeF4G7JBXUdIkqSI7ciEaW68ZxpI",
  authDomain: "noticeboard-ai.firebaseapp.com",
  projectId: "noticeboard-ai",
  storageBucket: "noticeboard-ai.firebasestorage.app",
  messagingSenderId: "103870395307",
  appId: "1:103870395307:web:ced65448604be75ad018ee",
  measurementId: "G-QPDN0ECK20"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPosts() {
  const querySnapshot = await getDocs(collection(db, "posts"));
  console.log(`Found ${querySnapshot.size} posts.`);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`Post: ${data.title}`);
    console.log(`  Latitude: ${data.latitude} (Type: ${typeof data.latitude})`);
    console.log(`  Longitude: ${data.longitude} (Type: ${typeof data.longitude})`);
  });
  process.exit();
}

checkPosts().catch(console.error);
