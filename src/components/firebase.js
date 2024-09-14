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
  apiKey: "AIzaSyDof8hxotTUQlxAuSz9BWji7p_9fg9IpVs",
  authDomain: "gem-vi.firebaseapp.com",
  projectId: "gem-vi",
  storageBucket: "gem-vi.appspot.com",
  messagingSenderId: "162510409501",
  appId: "1:162510409501:web:a20cacc7142ba1810cdbf4",
  measurementId: "G-72GWMFH6PS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, auth, storage };