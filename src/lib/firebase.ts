import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  collection, 
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { Classroom } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect if Firebase is fully provisioned or still using placeholder values
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY" && 
  firebaseConfig.projectId !== "PLACEHOLDER_PROJECT_ID";

// Log initialization status
console.log('Firebase configure status:', isFirebaseConfigured ? 'READY' : 'PENDING/PLACEHOLDER');

// Safe Initialization
const app = (!getApps().length) ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard 8-Pillar Firestore Errors Interface
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Sign-In helper (Pop-up fits best inside Sandboxed iFrames)
export async function loginWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured yet. Please complete the setup using the Firebase UI standard flow.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  }
}

// Global Log-Out Handler
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Signout failed:", error);
    throw error;
  }
}

// Upload/Sync single classroom to user's personalized path in cloud
export async function syncClassroomToCloud(userId: string, classroom: Classroom): Promise<void> {
  if (!isFirebaseConfigured) return;
  const path = `users/${userId}/classes/${classroom.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'classes', classroom.id);
    const dataToSync = {
      id: classroom.id,
      name: classroom.name,
      subject: classroom.subject || "",
      students: classroom.students || [],
      history: classroom.history || [],
      updatedAt: new Date().toISOString(),
      sessionActive: classroom.sessionActive || false,
      sessionStartTime: classroom.sessionStartTime || null,
      sessionElapsedTime: classroom.sessionElapsedTime || "00:00",
      sessionHistory: classroom.sessionHistory || []
    };
    await setDoc(docRef, dataToSync);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch all classes for an authenticated user from Firestore
export async function fetchClassroomsFromCloud(userId: string): Promise<Classroom[]> {
  if (!isFirebaseConfigured) return [];
  const path = `users/${userId}/classes`;
  try {
    const colRef = collection(db, 'users', userId, 'classes');
    const querySnapshot = await getDocs(colRef);
    const classes: Classroom[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      classes.push({
        id: data.id,
        name: data.name,
        subject: data.subject || "",
        students: data.students || [],
        history: data.history || [],
        sessionActive: data.sessionActive || false,
        sessionStartTime: data.sessionStartTime || null,
        sessionElapsedTime: data.sessionElapsedTime || "00:00",
        sessionHistory: data.sessionHistory || []
      } as Classroom);
    });
    return classes;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Delete classroom from Cloud
export async function deleteClassroomFromCloud(userId: string, classId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  const path = `users/${userId}/classes/${classId}`;
  try {
    const docRef = doc(db, 'users', userId, 'classes', classId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Fetch a single classroom's complete schema from Cloud Database
export async function fetchClassroomDetailsFromCloud(userId: string, classId: string): Promise<Classroom | null> {
  if (!isFirebaseConfigured) return null;
  const path = `users/${userId}/classes/${classId}`;
  try {
    const docRef = doc(db, 'users', userId, 'classes', classId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: data.id,
        name: data.name,
        subject: data.subject || "",
        students: data.students || [],
        history: data.history || [],
        sessionActive: data.sessionActive || false,
        sessionStartTime: data.sessionStartTime || null,
        sessionElapsedTime: data.sessionElapsedTime || "00:00",
        sessionHistory: data.sessionHistory || []
      } as Classroom;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Test Connection Helper (Required Constraint: validated on boot)
export async function checkConnection() {
  if (!isFirebaseConfigured) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client detected as offline.");
    }
  }
}
checkConnection();
