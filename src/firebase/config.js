import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAFtj-3ydVn-_Z870GJNnLLRjvR2NqZaOc",
  authDomain: "bhplusauth.firebaseapp.com",
  projectId: "bhplusauth",
  storageBucket: "bhplusauth.firebasestorage.app",
  messagingSenderId: "1097573153401",
  appId: "1:1097573153401:web:f5b9e3a7f26cadc9a172a8",
  measurementId: "G-XB6QHN9QT4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);