import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRwr2f1AdOWfj5vqaKjWGAct_ncrwngIo",
  authDomain: "edutrack-5da5c.firebaseapp.com",
  projectId: "edutrack-5da5c",
  storageBucket: "edutrack-5da5c.firebasestorage.app",
  messagingSenderId: "462857112524",
  appId: "1:462857112524:web:fe80ef3cca0ef3105bab69",
  measurementId: "G-PLKESFR8CV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 