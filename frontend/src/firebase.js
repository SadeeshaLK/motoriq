// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdJrPilKIV681gTgj7bBYa4vCX7CdqeDQ",
  authDomain: "kittt-343d0.firebaseapp.com",
  databaseURL: "https://kittt-343d0.firebaseio.com",
  projectId: "kittt-343d0",
  storageBucket: "kittt-343d0.firebasestorage.app",
  messagingSenderId: "395232445384",
  appId: "1:395232445384:web:a433436bb982683b98b6fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);