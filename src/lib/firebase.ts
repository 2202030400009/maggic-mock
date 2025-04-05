
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDq5n5h-PAl08LwLF4x0hfwCDrWZWxO3CU",
  authDomain: "maggicmock.firebaseapp.com",
  projectId: "maggicmock",
  storageBucket: "maggicmock.firebasestorage.app",
  messagingSenderId: "355529743420",
  appId: "1:355529743420:web:533b03accbdf11106b3739",
  measurementId: "G-N480BH7N2P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
