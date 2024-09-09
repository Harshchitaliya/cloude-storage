// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOMGDb8JcIUWcBCr3C0Ll-FIGxlmZCXeU",
  authDomain: "cloude-web-bb7ac.firebaseapp.com",
  projectId: "cloude-web-bb7ac",
  storageBucket: "cloude-web-bb7ac.appspot.com",
  messagingSenderId: "397717071574",
  appId: "1:397717071574:web:d2adcf51ee541b51d14b77",
  measurementId: "G-E15WE0D8XX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, auth, storage };