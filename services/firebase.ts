import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged as firebaseOnAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyDcdQST8gTH8DCF9b57F0Bsd9vBcM3gcDU",
  authDomain: "globetrekker-65557.firebaseapp.com",
  databaseURL: "https://globetrekker-65557-default-rtdb.firebaseio.com",
  projectId: "globetrekker-65557",
  storageBucket: "globetrekker-65557.firebasestorage.app",
  messagingSenderId: "109350336616",
  appId: "1:109350336616:web:8f7271f3dc6e567d15a3dd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signUpWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const signInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const logout = () => signOut(auth);
export const onAuthStateChanged = firebaseOnAuthStateChanged;
export type { FirebaseUser };
