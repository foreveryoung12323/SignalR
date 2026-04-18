import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {

  apiKey: "AIzaSyDj20GielsMAuUUPMjZ-YtxkTpc255vhLA",

  authDomain: "socialnet-2583e.firebaseapp.com",

  projectId: "socialnet-2583e",

  storageBucket: "socialnet-2583e.firebasestorage.app",

  messagingSenderId: "795932639931",

  appId: "1:795932639931:web:fd0363fe0ea311a6fe5f9e",

  measurementId: "G-FW6N7414J7"

};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Завжди питати, який акаунт вибрати
googleProvider.setCustomParameters({ prompt: 'select_account' });