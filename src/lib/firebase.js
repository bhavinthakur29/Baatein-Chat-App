import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API,
  authDomain: "baateinchat-70c91.firebaseapp.com",
  projectId: "baateinchat-70c91",
  storageBucket: "baateinchat-70c91.appspot.com",
  messagingSenderId: "1020990189797",
  appId: "1:1020990189797:web:562de759312774cf09240c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
