// firebase-config.js - Configurazione Firebase

const firebaseConfig = {
  apiKey: "AIzaSyCRS0fqNfSBHNdw1RrefH_78Okv7tsKyXc",
  authDomain: "tombola-words.firebaseapp.com",
  databaseURL: "https://tombola-words-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tombola-words",
  storageBucket: "tombola-words.firebasestorage.app",
  messagingSenderId: "742947961986",
  appId: "1:742947961986:web:9cf11037c09be68bdc889b"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Ottieni riferimento al database
const database = firebase.database();

console.log('🔥 Firebase connesso!');