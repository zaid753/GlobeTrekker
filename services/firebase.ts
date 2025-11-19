import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDcdQST8gTH8DCF9b57F0Bsd9vBcM3gcDU",
  authDomain: "globetrekker-65557.firebaseapp.com",
  databaseURL: "https://globetrekker-65557-default-rtdb.firebaseio.com",
  projectId: "globetrekker-65557",
  storageBucket: "globetrekker-65557.firebasestorage.app",
  messagingSenderId: "109350336616",
  appId: "1:109350336616:web:8f7271f3dc6e567d15a3dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

/**
 * Initiates the Google Sign-In popup flow.
 */
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

/**
 * Creates a new user with the provided email and password.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 */
export const signUpWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Signs in an existing user with the provided email and password.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 */
export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sends a password reset email to the user.
 * @param {string} email The user's email.
 */
export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Signs the current user out.
 */
export const logout = () => {
  return signOut(auth);
};

// Exporting onAuthStateChanged to be used in App.tsx to listen for auth state changes.
export { onAuthStateChanged };
export type { User as FirebaseUser };