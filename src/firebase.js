import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Importăm baza de date

const firebaseConfig = {
  apiKey: "AiZaSyCD6v1RPqnrQrtnvJic147saOHnV8Unn7A",
  authDomain: "movie-watchlist-cfce8.firebaseapp.com",
  projectId: "movie-watchlist-cfce8",
  storageBucket: "movie-watchlist-cfce8.firebasestorage.app",
  messagingSenderId: "716021766424",
  appId: "1:716021766424:web:258d47a952907e03a7a66d",
  measurementId: "G-EZ92Y0H876"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);