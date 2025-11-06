
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDq5n5h-PAl08LwLF4x0hfwCDrWZWxO3CU",
//   authDomain: "maggicmock.firebaseapp.com",
//   projectId: "maggicmock",
//   storageBucket: "maggicmock.firebasestorage.app",
//   messagingSenderId: "355529743420",
//   appId: "1:355529743420:web:533b03accbdf11106b3739",
//   measurementId: "G-N480BH7N2P"
// };
const firebaseConfig = {
  apiKey: "AIzaSyBWJzcN1oKpHjRUO--G7DgS82noVWbaHXc",
  authDomain: "magicdummy.firebaseapp.com",
  projectId: "magicdummy",
  storageBucket: "magicdummy.firebasestorage.app",
  messagingSenderId: "602997599086",
  appId: "1:602997599086:web:0ca2b6f42d8e6754dbaf7f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
