
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwOMwPEbm48cj_M3wUnOXTpZJiMzaRzBc",
  authDomain: "smart-report-mahasina-1c0df.firebaseapp.com",
  projectId: "smart-report-mahasina-1c0df",
  storageBucket: "smart-report-mahasina-1c0df.firebasestorage.app",
  messagingSenderId: "643256435966",
  appId: "1:643256435966:web:692bc2c71c47c172da51af"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
