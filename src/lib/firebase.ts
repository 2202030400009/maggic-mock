
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWJzcN1oKpHjRUO--G7DgS82noVWbaHXc",
  authDomain: "magicdummy.firebaseapp.com",
  projectId: "magicdummy",
  storageBucket: "magicdummy.firebasestorage.app",
  messagingSenderId: "602997599086",
  appId: "1:602997599086:web:0ca2b6f42d8e6754dbaf7f",
  measurementId: "G-Z0XKNFMMSK"
};
// const firebaseConfig = {
//   apiKey: "AIzaSyBWJzcN1oKpHjRUO--G7DgS82noVWbaHXc",
//   authDomain: "magicdummy.firebaseapp.com",
//   projectId: "magicdummy",
//   storageBucket: "magicdummy.firebasestorage.app",
//   messagingSenderId: "602997599086",
//   appId: "1:602997599086:web:0ca2b6f42d8e6754dbaf7f",
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
