import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcMInWptZfDOEiAgX71fiWgzHtdjJS3a0",
  authDomain: "routine-tracker-82e5c.firebaseapp.com",
  projectId: "routine-tracker-82e5c",
  storageBucket: "routine-tracker-82e5c.firebasestorage.app",
  messagingSenderId: "769942353616",
  appId: "1:769942353616:web:1f85abf21745b58e3010d5",
  measurementId: "G-17TFS0024E"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ADD THIS
export const googleProvider = new GoogleAuthProvider();

export default app;