import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

// ------------------------------------------------------------------------------
// Firebase App 1: Admin Terminal Auth (admin-terminal-crwo)
// ------------------------------------------------------------------------------
const adminConfig = {
  apiKey: "AIzaSyC2QFe7nfZqCKkvEKs1gzO7LRUBdkxfXho",
  authDomain: "admin-terminal-crwo.firebaseapp.com",
  projectId: "admin-terminal-crwo",
  storageBucket: "admin-terminal-crwo.firebasestorage.app",
  messagingSenderId: "872201120185",
  appId: "1:872201120185:web:5dfd76afa4129fe403ae68"
};

const adminApp = getApps().find(a => a.name === 'adminApp') || initializeApp(adminConfig, 'adminApp');
export const adminAuth = getAuth(adminApp);

// ------------------------------------------------------------------------------
// Firebase App 2: Traffic Portal PIN Lock & Firestore (pin-lock-42296)
// ------------------------------------------------------------------------------
const trafficConfig = {
  apiKey: "AIzaSyDkaQJykAwr5vPtWyLJdQf1FC29EeOWpzo",
  authDomain: "pin-lock-42296.firebaseapp.com",
  projectId: "pin-lock-42296",
  storageBucket: "pin-lock-42296.firebasestorage.app",
  messagingSenderId: "577366349395",
  appId: "1:577366349395:web:8d5d6d4a6c2579b19d98a6"
};

const trafficApp = getApps().find(a => a.name === 'trafficApp') || initializeApp(trafficConfig, 'trafficApp');
export const trafficAuth = getAuth(trafficApp);
export const trafficDb = getFirestore(trafficApp);

// ------------------------------------------------------------------------------
// Firebase App 3: Search Directory PIN Lock & Firestore (pin-lock-392ac)
// ------------------------------------------------------------------------------
const searchConfig = {
  apiKey: "AIzaSyC3IWDG8xa7Hgngaislpbpqy1Cv-INtcfM",
  authDomain: "pin-lock-392ac.firebaseapp.com",
  projectId: "pin-lock-392ac",
  storageBucket: "pin-lock-392ac.firebasestorage.app",
  messagingSenderId: "833988801695",
  appId: "1:833988801695:web:32fa24a56bd45d28f99eaa"
};

const searchApp = getApps().find(a => a.name === 'searchApp') || initializeApp(searchConfig, 'searchApp');
export const searchAuth = getAuth(searchApp);
export const searchDb = getFirestore(searchApp);

// ------------------------------------------------------------------------------
// Helper 1: Firebase Auth for Admin Login Gate
// ------------------------------------------------------------------------------
export const verifyAdminWithFirebase = async (userInput: string, passInput: string): Promise<{ success: boolean; user?: string; error?: string }> => {
  try {
    let emailToAuth = userInput.trim();
    if (!emailToAuth.includes('@')) {
      emailToAuth = `${emailToAuth}@crwo.org`;
    }
    
    // Primary authentication via Firebase Auth SDK
    const userCredential = await signInWithEmailAndPassword(adminAuth, emailToAuth, passInput);
    return { success: true, user: userCredential.user.email || userInput };
  } catch (err: any) {
    // REST API fallback attempt
    try {
      let emailToAuth = userInput.trim();
      if (!emailToAuth.includes('@')) {
        emailToAuth = `${emailToAuth}@crwo.org`;
      }
      const restUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${adminConfig.apiKey}`;
      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToAuth, password: passInput, returnSecureToken: true })
      });
      const data = await restRes.json();
      if (restRes.ok && data.idToken) {
        return { success: true, user: data.email || userInput };
      } else {
        let msg = data.error?.message || err.message || 'Firebase Authentication Failed';
        if (msg.includes('INVALID_LOGIN_CREDENTIALS') || msg.includes('INVALID_PASSWORD') || msg.includes('EMAIL_NOT_FOUND')) {
          msg = 'Invalid Admin Credentials in Firebase Auth.';
        }
        return { success: false, error: msg };
      }
    } catch (restErr: any) {
      return { success: false, error: err.message || 'Firebase Authentication Failed' };
    }
  }
};

// ------------------------------------------------------------------------------
// Helper 2: Firebase Auth & Firestore for Traffic Control Portal Pin Lock
// ------------------------------------------------------------------------------
export const verifyTrafficPasscodeWithFirebase = async (passcode: string): Promise<{ success: boolean; error?: string }> => {
  const cleanPass = passcode.trim();
  if (!cleanPass) return { success: false, error: 'Passcode is required.' };

  // 1. Target exact Firestore path from user screenshot: SECURITY -> LOCK -> PIN
  try {
    const lockDocRef = doc(trafficDb, 'SECURITY', 'LOCK');
    const docSnap = await getDoc(lockDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const storedPin = data?.PIN !== undefined ? String(data.PIN).trim() : (data?.pin !== undefined ? String(data.pin).trim() : '');
      if (storedPin && storedPin === cleanPass) {
        return { success: true };
      }
    }
  } catch (err) {
    console.warn('Firestore SDK lookup notice:', err);
  }

  // 2. Direct Firestore REST API fallback (SECURITY/LOCK)
  try {
    const restUrl = `https://firestore.googleapis.com/v1/projects/pin-lock-42296/databases/(default)/documents/SECURITY/LOCK?key=${trafficConfig.apiKey}`;
    const res = await fetch(restUrl);
    if (res.ok) {
      const json = await res.json();
      const fields = json.fields || {};
      const pinVal = fields.PIN?.stringValue || fields.pin?.stringValue || fields.PIN?.integerValue || fields.pin?.integerValue || fields.PIN?.bytesValue;
      if (pinVal && String(pinVal).trim() === cleanPass) {
        return { success: true };
      }
    }
  } catch (restErr) {
    console.warn('Firestore REST lookup notice:', restErr);
  }

  // 3. Fallback: scan collections in Firestore database
  try {
    const collectionsToCheck = ['SECURITY', 'security', 'pins', 'passcodes', 'traffic', 'keys', 'settings'];
    for (const colName of collectionsToCheck) {
      try {
        const querySnap = await getDocs(collection(trafficDb, colName));
        for (const docItem of querySnap.docs) {
          const val = docItem.data();
          if (val) {
            const checkPin = val.PIN !== undefined ? String(val.PIN).trim() : (val.pin !== undefined ? String(val.pin).trim() : (val.passcode || val.code || val.key));
            if (checkPin && String(checkPin).trim() === cleanPass) {
              return { success: true };
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  // 4. Try Firebase Auth fallback
  try {
    let trafficEmail = cleanPass.includes('@') ? cleanPass : `${cleanPass.toLowerCase().replace(/[^a-z0-9]/g, '')}@pin-lock-42296.firebaseapp.com`;
    const res = await signInWithEmailAndPassword(trafficAuth, trafficEmail, cleanPass);
    if (res.user) return { success: true };
  } catch (authErr) {}

  return { success: false, error: 'Access Denied: Invalid Security Passcode.' };
};

// ------------------------------------------------------------------------------
// Helper 3: Firebase Auth & Firestore for Search Directory Pin Lock (pin-lock-392ac)
// ------------------------------------------------------------------------------
export const verifySearchPasscodeWithFirebase = async (passcode: string): Promise<{ success: boolean; error?: string }> => {
  const cleanPass = passcode.trim();
  if (!cleanPass) return { success: false, error: 'Passcode is required.' };

  // 1. Target exact Firestore path: SECURITY -> LOCK -> PIN
  try {
    const lockDocRef = doc(searchDb, 'SECURITY', 'LOCK');
    const docSnap = await getDoc(lockDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const storedPin = data?.PIN !== undefined ? String(data.PIN).trim() : (data?.pin !== undefined ? String(data.pin).trim() : '');
      if (storedPin && storedPin === cleanPass) {
        return { success: true };
      }
    }
  } catch (err) {
    console.warn('Firestore SDK lookup notice:', err);
  }

  // 2. Direct Firestore REST API fallback (SECURITY/LOCK)
  try {
    const restUrl = `https://firestore.googleapis.com/v1/projects/pin-lock-392ac/databases/(default)/documents/SECURITY/LOCK?key=${searchConfig.apiKey}`;
    const res = await fetch(restUrl);
    if (res.ok) {
      const json = await res.json();
      const fields = json.fields || {};
      const pinVal = fields.PIN?.stringValue || fields.pin?.stringValue || fields.PIN?.integerValue || fields.pin?.integerValue || fields.PIN?.bytesValue;
      if (pinVal && String(pinVal).trim() === cleanPass) {
        return { success: true };
      }
    }
  } catch (restErr) {
    console.warn('Firestore REST lookup notice:', restErr);
  }

  // 3. Fallback: scan collections in Firestore database
  try {
    const collectionsToCheck = ['SECURITY', 'security', 'pins', 'passcodes', 'traffic', 'keys', 'settings'];
    for (const colName of collectionsToCheck) {
      try {
        const querySnap = await getDocs(collection(searchDb, colName));
        for (const docItem of querySnap.docs) {
          const val = docItem.data();
          if (val) {
            const checkPin = val.PIN !== undefined ? String(val.PIN).trim() : (val.pin !== undefined ? String(val.pin).trim() : (val.passcode || val.code || val.key));
            if (checkPin && String(checkPin).trim() === cleanPass) {
              return { success: true };
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  // 4. Try Firebase Auth fallback
  try {
    let searchEmail = cleanPass.includes('@') ? cleanPass : `${cleanPass.toLowerCase().replace(/[^a-z0-9]/g, '')}@pin-lock-392ac.firebaseapp.com`;
    const res = await signInWithEmailAndPassword(searchAuth, searchEmail, cleanPass);
    if (res.user) return { success: true };
  } catch (authErr) {}

  return { success: false, error: 'Access Denied: Invalid Security Passcode.' };
};
