import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserAccount, SavedReport, TrophyCard } from '../types';
import { sanitizeForJSON, safeJsonStringify } from '../utils/privacyStorage';

// Standardized Firestore Error Logger as per Firebase Skill guidelines
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.error('Firestore Error:', safeJsonStringify(errInfo));
  return errInfo;
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
// CRITICAL: Initialize Firestore with persistent local cache to allow offline support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Connection testing helper (lazy)
async function testFirestoreConnection() {
  try {
    if (firebaseConfig.firestoreDatabaseId) {
      await getDocFromServer(doc(db, 'test', 'connection'));
    }
  } catch (error: any) {
    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
      console.log("[Firestore Client] Running in offline persistence mode. Operations will sync automatically when connected.");
    } else {
      // Suppress initial test document permission errors when database is idle or initializing
    }
  }
}
setTimeout(() => {
  testFirestoreConnection().catch(() => {});
}, 1000);

// Helper to process user account and sync to Firestore
async function processUserAccount(fbUser: FirebaseUser): Promise<UserAccount> {
  const userAccount: UserAccount = {
    id: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Klutchh Athlete',
    email: fbUser.email || '',
    role: 'Coach',
    clubOrSchool: 'Google Connected Account',
    avatar: fbUser.photoURL || undefined
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), {
      uid: fbUser.uid,
      name: userAccount.name,
      email: userAccount.email,
      role: userAccount.role,
      clubOrSchool: userAccount.clubOrSchool,
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
  }

  return userAccount;
}

// Check for redirect result (lazy / called on mount)
export async function checkRedirectAuthResult(): Promise<UserAccount | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      return await processUserAccount(result.user);
    }
  } catch (err) {
    console.warn("Redirect result error:", err);
  }
  return null;
}

// Google Auth Sign-In
export const signInWithGoogle = async (): Promise<UserAccount | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await processUserAccount(result.user);
  } catch (err: any) {
    const isMobile = /mobile|iphone|ipad|android/i.test(navigator.userAgent);
    if (isMobile || err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
      console.log("Popup restricted or mobile device detected. Falling back to signInWithRedirect...");
      await signInWithRedirect(auth, googleProvider);
      return null; // Will redirect page
    }
    throw err;
  }
};

// Email/Password Registration
export const signUpWithEmail = async (email: string, pass: string, name: string, role: 'Coach' | 'Athlete' | 'Parent', clubOrSchool: string): Promise<UserAccount> => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = result.user;

  const userAccount: UserAccount = {
    id: fbUser.uid,
    name: name || email.split('@')[0],
    email: email,
    role: role,
    clubOrSchool: clubOrSchool || 'Klutchh Sports Club'
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), {
      uid: fbUser.uid,
      name: userAccount.name,
      email: userAccount.email,
      role: userAccount.role,
      clubOrSchool: userAccount.clubOrSchool,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
  }

  return userAccount;
};

// Email/Password Login
export const loginWithEmail = async (email: string, pass: string): Promise<UserAccount> => {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = result.user;

  // Try to load user profile from Firestore
  try {
    const docSnap = await getDoc(doc(db, 'users', fbUser.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: fbUser.uid,
        name: data.name || fbUser.displayName || email.split('@')[0],
        email: fbUser.email || email,
        role: data.role || 'Coach',
        clubOrSchool: data.clubOrSchool || 'Klutchh Sports Club'
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
  }

  return {
    id: fbUser.uid,
    name: fbUser.displayName || email.split('@')[0],
    email: fbUser.email || email,
    role: 'Coach',
    clubOrSchool: 'Klutchh Member'
  };
};

// Sign Out
export const logoutFirebase = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Logout error:', e);
  }
};

// Save Report to Firestore
export const saveReportToFirestore = async (report: SavedReport, userId: string) => {
  if (!auth.currentUser) {
    console.warn('Skipping Firestore save: User is not authenticated with Firebase.');
    return;
  }
  try {
    const cleanReport = sanitizeForJSON(report) || {};
    const reportDocRef = doc(db, 'savedReports', report.id);
    await setDoc(reportDocRef, {
      ...cleanReport,
      userId,
      createdAt: report.createdAt || new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `savedReports/${report.id}`);
  }
};

// Fetch User's Saved Reports
export const fetchUserSavedReports = async (userId: string): Promise<SavedReport[]> => {
  if (!auth.currentUser) {
    return [];
  }
  try {
    const q = query(
      collection(db, 'savedReports'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const reports: SavedReport[] = [];
    querySnapshot.forEach((doc) => {
      reports.push(doc.data() as SavedReport);
    });
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'savedReports');
    return [];
  }
};

// Delete Report from Firestore
export const deleteReportFromFirestore = async (reportId: string) => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'savedReports', reportId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `savedReports/${reportId}`);
  }
};

// Update User Profile in Firestore
export const updateUserProfileInFirestore = async (userId: string, updates: { name: string; role: 'Coach' | 'Athlete' | 'Parent'; clubOrSchool: string }) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      name: updates.name,
      role: updates.role,
      clubOrSchool: updates.clubOrSchool,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
};

// Save Trophy Card to Firestore
export const saveTrophyCardToFirestore = async (card: TrophyCard) => {
  if (!auth.currentUser) return;
  try {
    const cleanCard = sanitizeForJSON(card) || {};
    const cardDocRef = doc(db, 'trophyCards', card.id);
    await setDoc(cardDocRef, {
      ...cleanCard,
      userId: auth.currentUser.uid,
      createdAt: card.createdAt || new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `trophyCards/${card.id}`);
  }
};

// Fetch User's Trophy Cards
export const fetchUserTrophyCards = async (userId: string): Promise<TrophyCard[]> => {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, 'trophyCards'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const cards: TrophyCard[] = [];
    querySnapshot.forEach((doc) => {
      cards.push(doc.data() as TrophyCard);
    });
    return cards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'trophyCards');
    return [];
  }
};

// Delete Trophy Card from Firestore
export const deleteTrophyCardFromFirestore = async (cardId: string) => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'trophyCards', cardId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `trophyCards/${cardId}`);
  }
};


