import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User preferences
export const saveUserPreferences = async (email: string, preferences: any) => {
    // Left local for now or could migrate to Firebase. We will focus on trips and comments per requirements.
};

// Trips
export const saveTripToRemote = async (tripData: any) => {
    if (!auth.currentUser) throw new Error("Must be logged in");
    const docRef = doc(collection(db, 'trips'));
    const id = docRef.id;
    try {
        await setDoc(docRef, {
            id,
            userId: auth.currentUser.uid,
            tripTitle: tripData.itinerary.trip_title || tripData.details.destination,
            details: tripData.details,
            itinerary: tripData.itinerary,
            isPublic: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return id;
    } catch(err) {
        handleFirestoreError(err, OperationType.CREATE, 'trips');
    }
};

export const updateTripToPublic = async (tripId: string) => {
    if (!auth.currentUser) throw new Error("Must be logged in");
    try {
        await updateDoc(doc(db, 'trips', tripId), {
            isPublic: true,
            updatedAt: serverTimestamp()
        });
    } catch(err) {
        handleFirestoreError(err, OperationType.UPDATE, `trips/${tripId}`);
    }
};

export const getTripFromRemote = async (tripId: string) => {
    try {
        const d = await getDoc(doc(db, 'trips', tripId));
        if (d.exists()) {
            return d.data();
        }
        return null;
    } catch(err) {
        handleFirestoreError(err, OperationType.GET, `trips/${tripId}`);
    }
};

export const subscribeToComments = (tripId: string, activityId: string, callback: (comments: any[]) => void) => {
    const q = query(
        collection(db, `trips/${tripId}/comments`), 
        where("activityId", "==", activityId),
        orderBy("createdAt", "asc")
    );
    
    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(comments);
    }, (error) => {
        console.error("Comment sync error", error);
    });
};

export const addComment = async (tripId: string, activityId: string, text: string) => {
    if (!auth.currentUser) throw new Error("Must be logged in");
    const docRef = doc(collection(db, `trips/${tripId}/comments`));
    try {
        await setDoc(docRef, {
            id: docRef.id,
            tripId,
            activityId,
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            text,
            createdAt: serverTimestamp()
        });
    } catch(err) {
        handleFirestoreError(err, OperationType.CREATE, `trips/${tripId}/comments`);
    }
};

export const deleteComment = async (tripId: string, commentId: string) => {
    if (!auth.currentUser) throw new Error("Must be logged in");
    try {
        await deleteDoc(doc(db, `trips/${tripId}/comments/${commentId}`));
    } catch(err) {
        handleFirestoreError(err, OperationType.DELETE, `trips/${tripId}/comments/${commentId}`);
    }
};

export const subscribeToPresence = (tripId: string, callback: (users: any[]) => void) => {
    const q = collection(db, `trips/${tripId}/presence`);
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        // Filter out stale presence (older than 2 minutes)
        const activeUsers = users.filter((u: any) => {
             if (!u.lastActive) return false;
             const diff = Date.now() - (u.lastActive.toMillis?.() || Date.now());
             return diff < 120000;
        });
        callback(activeUsers);
    }, (error) => {
        console.error("Presence sync error", error);
    });
};

export const updatePresence = async (tripId: string, email: string) => {
    if (!auth.currentUser) return;
    try {
        await setDoc(doc(db, `trips/${tripId}/presence/${auth.currentUser.uid}`), {
            email,
            lastActive: serverTimestamp(),
            // Ensure we do not overwrite if this is just a ping
        }, { merge: true });
    } catch (e) {
        // Silently fail for presence as it shouldn't break the app
    }
};

export const clearPresence = async (tripId: string) => {
    if (!auth.currentUser) return;
    try {
        await deleteDoc(doc(db, `trips/${tripId}/presence/${auth.currentUser.uid}`));
    } catch (e) {
        // Silently fail
    }
};
