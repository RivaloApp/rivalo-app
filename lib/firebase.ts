import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCL8ndFoMl6oYZ1_DsiTo7-6LFkvze9hGo",
  authDomain: "rivalo-f38cf.firebaseapp.com",
  projectId: "rivalo-f38cf",
  storageBucket: "rivalo-f38cf.firebasestorage.app",
  messagingSenderId: "31724539960",
  appId: "1:31724539960:web:87bcecdda9d36503f396cd",
  measurementId: "G-G0N1NRP6YG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
