import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocFromServer,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local cached progress.');
    }
  }
}

// Authentication
export async function loginWithGoogle(): Promise<User> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (err) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Generate friendly 6-char friend code: e.g. BEAN-492
export function generateFriendCode(): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `BEAN-${num}`;
}

// Island & Crop Interfaces
export interface CropData {
  id: string;
  ownerId: string;
  cropType: 'wheat' | 'starberry' | 'moonblossom' | 'sunflower';
  stage: number; // 0: seed, 1: sprout, 2: blooming, 3: golden harvest
  waterMinutes: number;
}

export interface IslandData {
  ownerId: string;
  ownerName: string;
  islandName: string;
  houseLevel: number; // 1: Cabin, 2: Cottage, 3: Observatory
  decor: Record<string, boolean>;
  theme: string;
  beanOutfit: {
    color: string;
    hat: string;
    accessory: string;
  };
}
