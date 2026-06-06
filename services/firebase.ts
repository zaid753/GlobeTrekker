import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged as firebaseOnAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signUpWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const signInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const logout = () => signOut(auth);
export const onAuthStateChanged = firebaseOnAuthStateChanged;
export type { FirebaseUser };
