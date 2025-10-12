import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

// Google OAuth Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with email and password
 * Returns Firebase ID token which should be sent to backend
 */
export const signInWithEmail = async (email: string, password: string): Promise<string> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};

/**
 * Register new user with email and password
 * Returns Firebase ID token which should be sent to backend
 */
export const registerWithEmail = async (
  email: string, 
  password: string
): Promise<string> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};

/**
 * Sign in with Google OAuth
 * Returns Firebase ID token which should be sent to backend
 */
export const signInWithGoogle = async (): Promise<string> => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
  // Clear backend tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  await firebaseSendPasswordResetEmail(auth, email);
};

/**
 * Get current Firebase user ID token
 * Use this to send to backend for verification
 */
export const getCurrentUserToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
};

/**
 * Get current Firebase user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export { auth };